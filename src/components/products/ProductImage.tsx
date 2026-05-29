import {
  encodeProductImagePath,
  getResponsiveCloudinaryImage,
  shouldUnoptimizeProductImage,
  type ProductImageDisplaySize,
} from "@/lib/product-image-url";
import { isCloudinaryPanelUrl, cloudinaryImageAttributes } from "@/lib/product-upload-paths";
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

function cloudinaryImgClassName(fill: boolean | undefined, className?: string) {
  return fill
    ? `absolute inset-0 h-full w-full ${className ?? ""}`.trim()
    : className;
}

/** Imagen de catálogo con rutas codificadas y sin optimizador cuando hace falta. */
export function ProductImage({
  src,
  alt,
  displaySize,
  sizes,
  fill,
  className,
  loading,
  ...rest
}: ProductImageProps) {
  const size = displaySize ?? inferDisplaySize(typeof sizes === "string" ? sizes : undefined);

  if (isCloudinaryPanelUrl(src)) {
    const responsive = getResponsiveCloudinaryImage(src, size);
    if (!responsive.src) return null;

    return (
      <img
        src={responsive.src}
        alt={typeof alt === "string" ? alt : ""}
        sizes={typeof (responsive.sizes ?? sizes) === "string" ? (responsive.sizes ?? sizes) : undefined}
        srcSet={responsive.srcSet}
        loading={loading === "eager" ? "eager" : "lazy"}
        decoding="async"
        className={cloudinaryImgClassName(fill, className)}
        {...cloudinaryImageAttributes(src)}
      />
    );
  }

  const encoded = encodeProductImagePath(src);
  if (!encoded) return null;

  return (
    <Image
      src={encoded}
      alt={alt}
      sizes={sizes}
      fill={fill}
      className={className}
      loading={loading}
      unoptimized={shouldUnoptimizeProductImage(src)}
      {...rest}
    />
  );
}
