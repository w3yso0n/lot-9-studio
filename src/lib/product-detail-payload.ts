import type { CatalogProduct } from "@/lib/catalog-product";

/** Reduce JSON enviado al cliente en la ficha (menos hidratación en móvil). */
export function slimProductForDetailPage(
  product: CatalogProduct
): CatalogProduct {
  const colorVariants = product.colorVariants ?? [];
  const hasColorVariants = colorVariants.length > 0;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice,
    color: product.color,
    desc: product.desc,
    sizes: product.sizes,
    images: hasColorVariants ? [] : product.images,
    coverImage: product.coverImage,
    stockBySize: hasColorVariants ? {} : product.stockBySize,
    colors: [],
    colorVariants: hasColorVariants ? colorVariants : undefined,
    variants: hasColorVariants ? undefined : product.variants,
  };
}
