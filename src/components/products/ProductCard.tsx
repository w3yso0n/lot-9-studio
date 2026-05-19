"use client";

import { ProductImage } from "@/components/products/ProductImage";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface ProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    oldPrice?: number | null;
    code?: string | number;
    images: string[];
    stockBySize: { [size: string]: number };
    sizes: string[];
    colors: string[];
    inStock?: boolean;
  };
  className?: string;
}

export const ProductCard = ({ product, className }: ProductProps) => {
  const mainImage = product.images[0];
  const hasImage = Boolean(mainImage?.trim());
  const oldPrice = product.oldPrice;

  const hasStock =
    product.inStock ??
    product.sizes.some((size) => (product.stockBySize[size] ?? 0) > 0);

  const showOldPrice =
    oldPrice !== undefined &&
    oldPrice !== null &&
    oldPrice > 1 &&
    oldPrice > product.price;

  return (
    <div className={`w-full ${className ?? ""}`}>
      <Card className="w-full shadow-lg rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <CardContent className="p-0 flex flex-col cursor-pointer">
            <div className="relative w-full h-[360px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-muted">
              {hasImage ? (
                <ProductImage
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                  Sin imagen
                </div>
              )}

              {!hasStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Image
                    src="/images/sold_out.png"
                    alt="Agotado"
                    width={200}
                    height={200}
                    className="opacity-90"
                  />
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-base sm:text-base md:text-lg font-bold text-center text-gray-900 dark:text-white">
                {product.name}
              </h3>

              <div className="flex flex-col items-center justify-center gap-1">
                {showOldPrice && (
                  <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 line-through">
                    ${oldPrice.toFixed(2)}
                  </span>
                )}

                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
};
