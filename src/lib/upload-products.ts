import { join } from "path";
import { PRODUCT_UPLOAD_WEB_PREFIX } from "./product-upload-paths";

export { isOwnedUploadPath, PRODUCT_UPLOAD_WEB_PREFIX } from "./product-upload-paths";

export function absolutePublicPathFromWeb(webPath: string): string {
  const rel = webPath.replace(/^\//, "");
  return join(process.cwd(), "public", rel);
}
