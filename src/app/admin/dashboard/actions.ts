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
import {
  absolutePublicPathFromWeb,
  isOwnedUploadPath,
  PRODUCT_UPLOAD_WEB_PREFIX,
} from "@/lib/upload-products";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
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
  if (!input.name) {
    return { error: "El nombre es obligatorio." };
  }
  if (!input.sizeOrder.length) {
    return { error: "Selecciona al menos una talla." };
  }
  if (input.imagePaths.length === 0) {
    return { error: "Añade al menos una imagen (sube un archivo o indica una ruta)." };
  }
  try {
    if (idRaw) {
      const id = Number(idRaw);
      if (!Number.isFinite(id)) return { error: "ID de producto inválido." };
      await updateProduct(id, input);
    } else {
      await insertProduct(input);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return { error: msg };
  }
  revalidateCatalog();
  redirect("/admin/dashboard");
}

export async function uploadProductImageAction(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
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
  const ext = MIME_EXT[file.type];
  if (!ext) {
    return { error: "Formato no permitido. Usa JPEG, PNG, WebP o GIF." };
  }
  const name = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, name), buf);
  const path = `${PRODUCT_UPLOAD_WEB_PREFIX}/${name}`;
  return { path };
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
    try {
      await unlink(absolutePublicPathFromWeb(path));
    } catch {
      /* archivo ya inexistente */
    }
  }
  revalidateCatalog();
  revalidatePath(`/admin/dashboard/products/${productId}`);
  return { ok: true };
}

/** Quita del disco una subida huérfana (producto aún no guardado o retirada de la lista). */
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
  try {
    await unlink(absolutePublicPathFromWeb(path));
  } catch {
    /* */
  }
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
      try {
        await unlink(absolutePublicPathFromWeb(p));
      } catch {
        /* */
      }
    }
  }
  revalidateCatalog();
  redirect("/admin/dashboard");
}
