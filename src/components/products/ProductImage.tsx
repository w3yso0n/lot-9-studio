"use client";

import {
  encodeProductImagePath,
  getProductImageDisplayUrl,
  shouldUnoptimizeProductImage,
  type ProductImageDisplaySize,
} from "@/lib/product-image-url";
import { isCloudinaryPanelUrl } from "@/lib/product-upload-paths";
import Image, { type ImageProps } from "next/image";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string;
  /** Aplica transformaciones Cloudinary (formato/tamaño) para la vitrina. */
  displaySize?: ProductImageDisplaySize;
};

function inferDisplaySize(sizes?: string): ProductImageDisplaySize {
  if (!sizes) return "card";
  if (/\b(64|96|128)px\b/.test(sizes)) return "thumb";
  return "card";
}

/** Imagen de catálogo con rutas codificadas y sin optimizador cuando hace falta. */
export function ProductImage({ src, alt, displaySize, sizes, ...rest }: ProductImageProps) {
  const size = displaySize ?? inferDisplaySize(typeof sizes === "string" ? sizes : undefined);
  const encoded = isCloudinaryPanelUrl(src)
    ? getProductImageDisplayUrl(src, size)
    : encodeProductImagePath(src);
  if (!encoded) return null;

  return (
    <Image
      src={encoded}
      alt={alt}
      sizes={sizes}
      unoptimized={shouldUnoptimizeProductImage(src)}
      {...rest}
    />
  );
}
