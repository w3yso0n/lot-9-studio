"use client";

import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import type { AdminProductBadge, AdminProductRow } from "@/lib/products-repo";
import { useEffect, useState } from "react";

type Props = {
  initial?: AdminProductRow | null;
  badges: AdminProductBadge[];
};

/** Vista previa solo en desktop (evita duplicar imágenes en móvil). */
export function AdminProductEditorShell({ initial, badges }: Props) {
  const [showLivePreview, setShowLivePreview] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setShowLivePreview(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <ProductEditorForm
      initial={initial}
      badges={badges}
      showLivePreview={showLivePreview}
    />
  );
}
