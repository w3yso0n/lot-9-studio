"use server";

import { verifyAdminSession } from "@/lib/admin-session";
import { hasCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary-server";
import { DEFAULT_HOME_SETTINGS } from "@/lib/home-settings";
import type { HomeSettings } from "@/lib/home-settings";
import { normalizeHomeHref, upsertHomeSettings } from "@/lib/home-settings-mutations";
import { toUserFacingProductSaveError, toUserFacingUploadError } from "@/lib/user-facing-errors";
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

export type SaveHomeSettingsState =
  | { ok?: boolean; error?: string; settings?: HomeSettings }
  | null;

async function uploadHomeFile(
  file: File,
  allowed: Record<string, string>,
  maxBytes: number,
  resourceType: "image" | "video"
): Promise<string> {
  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Cloudinary no está configurado. Añade CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET."
    );
  }
  if (file.size === 0) throw new Error("Archivo vacío.");
  if (file.size > maxBytes) {
    throw new Error(
      resourceType === "video"
        ? "El video supera 45 MB."
        : "La imagen supera 10 MB."
    );
  }
  const ext = allowed[file.type];
  if (!ext) {
    throw new Error(
      resourceType === "video"
        ? "Formato de video no permitido. Usa MP4 o WebM."
        : "Formato de imagen no permitido. Usa JPG, PNG o WebP."
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return uploadToCloudinary(buf, file.type, `home-${randomUUID()}${ext}`.replace(/\.[^.]+$/, ""), resourceType);
}

export async function saveHomeSettingsAction(
  _prev: SaveHomeSettingsState,
  formData: FormData
): Promise<SaveHomeSettingsState> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada. Vuelve a iniciar sesión." };
  }

  const heroFile = formData.get("hero_image_file");
  const videoFile = formData.get("featured_video_file");

  let heroImageUrl =
    String(formData.get("current_hero_image_url") ?? "").trim() ||
    DEFAULT_HOME_SETTINGS.heroImageUrl;
  let featuredVideoUrl =
    String(formData.get("featured_video_url") ?? "").trim() ||
    String(formData.get("current_featured_video_url") ?? "").trim() ||
    DEFAULT_HOME_SETTINGS.featuredVideoUrl;

  try {
    if (heroFile instanceof File && heroFile.size > 0) {
      heroImageUrl = await uploadHomeFile(
        heroFile,
        IMAGE_MIME_EXT,
        MAX_IMAGE_BYTES,
        "image"
      );
    }
    if (videoFile instanceof File && videoFile.size > 0) {
      featuredVideoUrl = await uploadHomeFile(
        videoFile,
        VIDEO_MIME_EXT,
        MAX_VIDEO_BYTES,
        "video"
      );
    }
  } catch (e) {
    console.error("[home-settings upload]", e);
    if (e instanceof Error) {
      return { error: e.message };
    }
    return { error: toUserFacingUploadError(e) };
  }

  const nextSettings: HomeSettings = {
    heroTitle:
      String(formData.get("hero_title") ?? "")
        .replace(/\\n/g, "\n")
        .trim() || DEFAULT_HOME_SETTINGS.heroTitle,
    heroSubtitle:
      String(formData.get("hero_subtitle") ?? "").trim() ||
      DEFAULT_HOME_SETTINGS.heroSubtitle,
    heroButtonText:
      String(formData.get("hero_button_text") ?? "").trim() ||
      DEFAULT_HOME_SETTINGS.heroButtonText,
    heroButtonHref: normalizeHomeHref(
      String(formData.get("hero_button_href") ?? "")
    ),
    heroImageUrl,
    featuredVideoUrl,
    isHeroEnabled: formData.get("is_hero_enabled") === "true",
    isVideoEnabled: formData.get("is_video_enabled") === "true",
  };

  try {
    await upsertHomeSettings(nextSettings);
  } catch (e) {
    console.error("[home-settings save]", e);
    return { error: toUserFacingProductSaveError(e) };
  }

  revalidateTag("home-settings");
  revalidatePath("/");
  revalidatePath("/admin/dashboard/home-settings");
  return { ok: true, settings: nextSettings };
}
