"use server";

import { verifyAdminSession } from "@/lib/admin-session";
import { replaceNewDropItems } from "@/lib/new-drops-mutations";
import { toUserFacingProductSaveError } from "@/lib/user-facing-errors";
import { revalidatePath, revalidateTag } from "next/cache";

export type SaveNewDropsState = { ok?: boolean; error?: string } | null;

export async function saveNewDropsAction(
  _prev: SaveNewDropsState,
  formData: FormData
): Promise<SaveNewDropsState> {
  if (!(await verifyAdminSession())) {
    return { error: "Sesión caducada. Vuelve a iniciar sesión." };
  }

  const productIds = formData.getAll("new_drop_product_ids").map(Number);
  const selectedImages = formData.getAll("new_drop_selected_images").map(String);

  try {
    await replaceNewDropItems(
      productIds
        .map((productId, index) => ({
          productId,
          selectedImagePath: selectedImages[index] ?? "",
          sortOrder: index,
        }))
        .filter((item) => Number.isFinite(item.productId) && item.productId > 0)
    );
  } catch (e) {
    return { error: toUserFacingProductSaveError(e) };
  }

  revalidateTag("catalog");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dashboard/new-drops");
  return { ok: true };
}
