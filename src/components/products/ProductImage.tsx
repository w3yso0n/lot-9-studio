"use client";

import {
  encodeProductImagePath,
  shouldUnoptimizeProductImage,
} from "@/lib/product-image-url";
import Image, { type ImageProps } from "next/image";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** Imagen de catálogo con rutas codificadas y sin optimizador cuando hace falta. */
export function ProductImage({ src, alt, ...rest }: ProductImageProps) {
  const encoded = encodeProductImagePath(src);
  if (!encoded) return null;

  return (
    <Image
      src={encoded}
      alt={alt}
      unoptimized={shouldUnoptimizeProductImage(src)}
      {...rest}
    />
  );
}
