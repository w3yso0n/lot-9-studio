"use client";

import { encodeProductImagePath } from "@/lib/product-image-url";
import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

/** Vista previa admin: blob/data con img nativo (next/image rompe en móvil). */
export function AdminPreviewImage({
  src,
  alt = "",
  className,
  fill,
  sizes = "400px",
  width,
  height,
}: Props) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (/^(blob:|data:)/i.test(trimmed)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trimmed} alt={alt} className={className} decoding="async" />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmed}
        alt={alt}
        width={width ?? 200}
        height={height ?? 200}
        className={className}
        decoding="async"
      />
    );
  }

  const encoded = encodeProductImagePath(trimmed);
  if (!encoded) return null;

  if (fill) {
    return (
      <Image
        src={encoded}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={encoded}
      alt={alt}
      width={width ?? 200}
      height={height ?? 200}
      className={className}
      sizes={sizes}
      unoptimized
    />
  );
}
