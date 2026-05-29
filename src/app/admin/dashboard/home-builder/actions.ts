"use server";

import { verifyAdminSession } from "@/lib/admin-session";
import { hasCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary-server";
import { replaceHomeSections } from "@/lib/home-sections-mutations";
import type { HomeSectionInput } from "@/lib/home-sections-mutations";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const VIDEO_MIME_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;

export type SaveHomeSectionsState = { ok?: boolean; error?: string } | null;

async function uploadBuilderFile(
  file: File,
  resourceType: "image" | "video"
): Promise<string> {
  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Cloudinary no está configurado. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET."
    );
  }
  const allowed = resourceType === "image" ? IMAGE_MIME_EXT : VIDEO_MIME_EXT;
  const maxBytes = resourceType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size === 0) throw new Error("Archivo vacío.");
  if (file.size > maxBytes) {
    throw new Error(
      resourceType === "image"
        ? "La imagen supera 10 MB."
        : "El video supera 45 MB."
    );
  }
  const ext = allowed[file.type];
  if (!ext) {
    throw new Error(
      resourceType === "image"
        ? "Formato de imagen no permitido. Usa JPG, PNG o WebP."
        : "Formato de video no permitido. Usa MP4 o WebM."
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return uploadToCloudinary(
    buf,
    file.type,
    `home-section-${randomUUID()}${ext}`.replace(/\.[^.]+$/, ""),
    resourceType
  );
}

export async function uploadHomeSectionAssetAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada. Vuelve a iniciar sesión." };
  }
  const file = formData.get("file");
  const resourceType = String(formData.get("resource_type") ?? "image");
  if (!(file instanceof File)) return { error: "No se recibió ningún archivo." };
  try {
    return {
      url: await uploadBuilderFile(
        file,
        resourceType === "video" ? "video" : "image"
      ),
    };
  } catch (error) {
    console.error("[home-builder upload]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo subir el archivo.",
    };
  }
}

export async function saveHomeSectionsAction(
  _prev: SaveHomeSectionsState,
  formData: FormData
): Promise<SaveHomeSectionsState> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada. Vuelve a iniciar sesión." };
  }
  try {
    const raw = String(formData.get("sections") ?? "[]");
    const parsed = JSON.parse(raw) as HomeSectionInput[];
    if (!Array.isArray(parsed)) {
      return { error: "Formato inválido de secciones." };
    }
    await replaceHomeSections(parsed);
    revalidateTag("home-sections");
    revalidatePath("/");
    revalidatePath("/admin/dashboard/home-builder");
    return { ok: true };
  } catch (error) {
    console.error("[home-builder save]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el constructor.",
    };
  }
}
