"use server";

import { verifyAdminSession } from "@/lib/admin-session";
import {
  deleteProduct,
  deleteProductImageRow,
  insertProduct,
  listProductImagePaths,
  parseProductForm,
  updateProduct,
} from "@/lib/products-mutations";
import { toUserFacingProductSaveError, toUserFacingUploadError } from "@/lib/user-facing-errors";
import { hasCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary-server";
import { deletePanelUploadFile } from "@/lib/panel-upload-delete";
import {
  isOwnedUploadPath,
  PRODUCT_UPLOAD_WEB_PREFIX,
} from "@/lib/upload-products";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Sube bytes a Cloudinary o disco local (misma lógica que el panel). */
async function persistProductImageFromBuffer(buf: Buffer, mimeType: string): Promise<string> {
  const ext = MIME_EXT[mimeType];
  if (!ext) {
    throw new Error("Formato no permitido. Usa JPEG, PNG, WebP o GIF.");
  }
  const name = `${randomUUID()}${ext}`;
  const publicIdBase = name.replace(/\.[^.]+$/, "");

  if (hasCloudinaryConfig()) {
    return await uploadToCloudinary(buf, mimeType, publicIdBase);
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Falta configurar Cloudinary en Vercel. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET."
    );
  }

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buf);
  return `${PRODUCT_UPLOAD_WEB_PREFIX}/${name}`;
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/admin/dashboard");
  revalidateTag("catalog");
}

export type SaveProductState = { error?: string } | null;

export async function saveProductAction(
  _prev: SaveProductState,
  formData: FormData
): Promise<SaveProductState> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada. Vuelve a iniciar sesión." };
  }
  const idRaw = formData.get("id");
  const input = parseProductForm(formData);
  const pendingFiles = formData
    .getAll("pending_images")
    .filter((v): v is File => typeof v !== "string" && v instanceof File);
  const pendingVariantFiles = formData
    .getAll("pending_color_variant_images")
    .filter((v): v is File => typeof v !== "string" && v instanceof File);

  if (!input.name) {
    return { error: "El nombre es obligatorio." };
  }
  if (!input.sizeOrder.length) {
    return { error: "Selecciona al menos una talla." };
  }

  let imagePaths = input.imagePaths;
  let colorVariants = input.colorVariants;
  let uploadedVariantImages: string[] = [];

  // Producto nuevo: imágenes en `pending_images` (no se suben a Cloudinary hasta guardar).
  if (!idRaw && pendingFiles.length > 0) {
    const uploaded: string[] = [];
    try {
      for (const file of pendingFiles) {
        if (file.size === 0) {
          throw new Error("Archivo vacío.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("El archivo supera 5 MB.");
        }
        if (!MIME_EXT[file.type]) {
          throw new Error("Formato no permitido. Usa JPEG, PNG, WebP o GIF.");
        }
        const buf = Buffer.from(await file.arrayBuffer());
        uploaded.push(await persistProductImageFromBuffer(buf, file.type));
      }
      imagePaths = uploaded;
    } catch (e) {
      for (const u of uploaded) {
        await deletePanelUploadFile(u);
      }
      return { error: toUserFacingUploadError(e) };
    }
  }

  if (
    imagePaths.length === 0 &&
    pendingVariantFiles.length === 0 &&
    !colorVariants.some((variant) => variant.imagePaths.some(Boolean))
  ) {
    return { error: "Añade al menos una imagen (sube archivos y guarda, o indica una ruta)." };
  }

  if (!idRaw && pendingVariantFiles.length > 0) {
    const uploaded: string[] = [];
    try {
      for (const file of pendingVariantFiles) {
        if (file.size === 0) {
          throw new Error("Archivo vacio.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("El archivo supera 5 MB.");
        }
        if (!MIME_EXT[file.type]) {
          throw new Error("Formato no permitido. Usa JPEG, PNG, WebP o GIF.");
        }
        const buf = Buffer.from(await file.arrayBuffer());
        uploaded.push(await persistProductImageFromBuffer(buf, file.type));
      }

      let pendingIndex = 0;
      colorVariants = colorVariants
        .map((variant) => ({
          ...variant,
          imagePaths: variant.imagePaths.map((imagePath) => {
            if (imagePath) return imagePath;
            return uploaded[pendingIndex++] ?? "";
          }),
        }))
        .filter((variant) => variant.imagePaths.some(Boolean));
      uploadedVariantImages = uploaded;
    } catch (e) {
      for (const u of [...imagePaths, ...uploaded]) {
        await deletePanelUploadFile(u);
      }
      return { error: toUserFacingUploadError(e) };
    }
  }

  imagePaths = colorVariants[0]?.imagePaths.filter(Boolean) ?? imagePaths;

  if (imagePaths.length === 0) {
    return { error: "Agrega al menos un color del modelo con una imagen." };
  }

  const inputWithImages: typeof input = { ...input, imagePaths, colorVariants };

  try {
    if (idRaw) {
      const id = Number(idRaw);
      if (!Number.isFinite(id)) return { error: "ID de producto inválido." };
      await updateProduct(id, inputWithImages);
    } else {
      await insertProduct(inputWithImages);
    }
  } catch (e) {
    if (!idRaw && (pendingFiles.length > 0 || uploadedVariantImages.length > 0)) {
      for (const u of [...imagePaths, ...uploadedVariantImages]) {
        await deletePanelUploadFile(u);
      }
    }
    return { error: toUserFacingProductSaveError(e) };
  }
  try {
    revalidateCatalog();
  } catch {
    return {
      error:
        "El producto se guardó, pero no se pudo actualizar la vista de la tienda. Recarga la página de inicio o el catálogo.",
    };
  }
  redirect("/admin/dashboard");
}

export async function uploadProductImageAction(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  try {
    if (!(await verifyAdminSession())) {
      return { error: "Sesión caducada." };
    }
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { error: "No se recibió ningún archivo." };
    }
    if (file.size === 0) {
      return { error: "Archivo vacío." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "El archivo supera 5 MB." };
    }
    if (!MIME_EXT[file.type]) {
      return { error: "Formato no permitido. Usa JPEG, PNG, WebP o GIF." };
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const path = await persistProductImageFromBuffer(buf, file.type);
    return { path };
  } catch (e) {
    return { error: toUserFacingUploadError(e) };
  }
}

export async function deleteProductImageAction(
  productId: number,
  imagePath: string
): Promise<{ ok?: true; error?: string }> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada." };
  }
  if (!Number.isFinite(productId)) {
    return { error: "Producto inválido." };
  }
  const path = imagePath.trim();
  if (!path) {
    return { error: "Ruta vacía." };
  }
  const deleted = await deleteProductImageRow(productId, path);
  if (!deleted) {
    return { error: "No se encontró esa imagen en el producto." };
  }
  if (isOwnedUploadPath(path)) {
    await deletePanelUploadFile(path);
  }
  revalidateCatalog();
  revalidatePath(`/admin/dashboard/products/${productId}`);
  return { ok: true };
}

/** Quita del storage una subida huérfana (producto aún no guardado o retirada de la lista). */
export async function deleteOrphanUploadAction(
  imagePath: string
): Promise<{ ok?: true; error?: string }> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada." };
  }
  const path = imagePath.trim();
  if (!isOwnedUploadPath(path)) {
    return { error: "Solo se pueden borrar archivos subidos desde el panel." };
  }
  await deletePanelUploadFile(path);
  return { ok: true };
}

export async function deleteProductAction(formData: FormData) {
  if (!(await verifyAdminSession())) {
    redirect("/admin/login");
  }
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) {
    redirect("/admin/dashboard");
  }
  const paths = await listProductImagePaths(id);
  await deleteProduct(id);
  for (const p of paths) {
    if (isOwnedUploadPath(p)) {
      await deletePanelUploadFile(p);
    }
  }
  revalidateCatalog();
  redirect("/admin/dashboard");
}
