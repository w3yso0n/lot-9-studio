"use client";

import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { useEffect, useState } from "react";

/** Vista previa solo en desktop: en móvil duplica imágenes y puede tumbar el navegador. */
export function NewProductPageClient() {
  const [showLivePreview, setShowLivePreview] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setShowLivePreview(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return <ProductEditorForm showLivePreview={showLivePreview} />;
}
