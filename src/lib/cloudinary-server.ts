import "server-only";
import { createHash } from "node:crypto";
import { isCloudinaryPanelUrl } from "@/lib/product-upload-paths";

type CloudinaryResourceType = "image" | "video";

type CloudinaryEnv = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function readCloudinaryEnv(): CloudinaryEnv | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "lot9/products").replace(
    /^\/+|\/+$/g,
    ""
  );
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret, folder };
}

export function hasCloudinaryConfig(): boolean {
  return readCloudinaryEnv() != null;
}

function sign(params: Record<string, string | number>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(`${sorted}${apiSecret}`)
    .digest("hex");
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
  publicIdBase: string,
  resourceType: CloudinaryResourceType = "image"
): Promise<string> {
  const env = readCloudinaryEnv();
  if (!env) {
    throw new Error("Cloudinary no está configurado (faltan variables de entorno).");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: env.folder,
    public_id: publicIdBase,
    timestamp,
  };
  const signature = sign(paramsToSign, env.apiSecret);
  const form = new FormData();
  const bytes = new Uint8Array(fileBuffer);
  form.append("file", new Blob([bytes], { type: mimeType }));
  form.append("api_key", env.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", env.folder);
  form.append("public_id", publicIdBase);
  form.append("signature", signature);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: form,
    }
  );
  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    const reason = data.error?.message || "Upload rechazado por Cloudinary.";
    throw new Error(reason);
  }
  return data.secure_url;
}

function cloudinaryPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryPanelUrl(url)) return null;
  try {
    const u = new URL(url);
    const marker = "/image/upload/";
    const idx = u.pathname.indexOf(marker);
    if (idx < 0) return null;
    const tail = u.pathname.slice(idx + marker.length).replace(/^v\d+\//, "");
    const decoded = decodeURIComponent(tail);
    const noExt = decoded.replace(/\.[^/.]+$/, "");
    return noExt || null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(url: string): Promise<void> {
  const env = readCloudinaryEnv();
  if (!env) return;
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) return;
  if (!publicId.startsWith(`${env.folder}/`)) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { public_id: publicId, timestamp };
  const signature = sign(paramsToSign, env.apiSecret);
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", env.apiKey);
  form.append("signature", signature);
  form.append("invalidate", "true");
  await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  });
}
