import { unlink } from "node:fs/promises";
import { deleteFromCloudinary } from "@/lib/cloudinary-server";
import { isCloudinaryPanelUrl, isLocalPanelUploadPath } from "@/lib/product-upload-paths";
import { absolutePublicPathFromWeb } from "@/lib/upload-products";

/** Borra una subida del panel en Cloudinary (o rutas locales legadas en BD). */
export async function deletePanelUploadFile(webPath: string): Promise<void> {
  const p = webPath.trim();
  if (isCloudinaryPanelUrl(p)) {
    try {
      await deleteFromCloudinary(p);
    } catch {
      /* */
    }
    return;
  }
  if (isLocalPanelUploadPath(p)) {
    try {
      await unlink(absolutePublicPathFromWeb(p));
    } catch {
      /* */
    }
  }
}
