"use client";

import { AdminProductEditorShell } from "@/components/admin/AdminProductEditorShell";
import type { AdminProductBadge } from "@/lib/products-repo";

type Props = {
  badges: AdminProductBadge[];
};

export function NewProductPageClient({ badges }: Props) {
  return <AdminProductEditorShell badges={badges} />;
}
