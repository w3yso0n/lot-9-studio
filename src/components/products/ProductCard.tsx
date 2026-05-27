"use client";

import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductPrice } from "@/components/products/ProductPrice";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    oldPrice?: number | null;
    code?: string | number;
    images: string[];
    coverImage?: string | null;
    hoverImage?: string | null;
    stockBySize: { [size: string]: number };
    sizes: string[];
    colors: string[];
    inStock?: boolean;
  };
  className?: string;
}

export const ProductCard = ({ product, className }: ProductProps) => {
  const mainImage = product.coverImage || product.images[0];
  const configuredHoverImage = product.hoverImage || product.images[1] || "";
  const hoverImage =
    configuredHoverImage && configuredHoverImage !== mainImage
      ? configuredHoverImage
      : "";
  const [showHoverImage, setShowHoverImage] = useState(false);
  const displayImage = showHoverImage && hoverImage ? hoverImage : mainImage;
  const hasImage = Boolean(mainImage?.trim());
  const oldPrice = product.oldPrice;

  const hasStock =
    product.inStock ??
    product.sizes.some((size) => (product.stockBySize[size] ?? 0) > 0);

  return (
    <div className={`w-full ${className ?? ""}`}>
      <Card className="w-full shadow-lg rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0 flex flex-col">
          <Link
            href={`/products/${product.id}`}
            aria-label={`Ver producto ${product.name}`}
            className="block w-full text-left"
            onMouseEnter={hoverImage ? () => setShowHoverImage(true) : undefined}
            onMouseLeave={hoverImage ? () => setShowHoverImage(false) : undefined}
          >
            <div className="relative w-full h-[360px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-muted">
              {hasImage ? (
                <ProductImage
                  key={displayImage}
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-all duration-300 hover:scale-[1.03]"
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
          </Link>

          <div className="p-4 space-y-4">
            <Link href={`/products/${product.id}`} className="block text-center">
              <h3 className="text-base sm:text-base md:text-lg font-bold text-center text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <div className="flex flex-col items-center justify-center gap-1 pt-2">
                <ProductPrice price={product.price} oldPrice={product.oldPrice} />
              </div>
            </Link>

            {hasStock ? (
              <Button
                asChild
                className="h-11 w-full rounded-md bg-black text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                <Link href={`/products/${product.id}`}>Comprar ahora</Link>
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="h-11 w-full rounded-md bg-zinc-800 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300 opacity-100 disabled:pointer-events-none disabled:opacity-100 dark:bg-zinc-700 dark:text-zinc-300"
              >
                Agotado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
