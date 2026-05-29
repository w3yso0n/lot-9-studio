"use client";

import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/button";
import { ProductPrice } from "@/components/products/ProductPrice";
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
    badge?: {
      label: string;
      backgroundColor: string;
      textColor: string;
    } | null;
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
  const hasStock =
    product.inStock ??
    product.sizes.some((size) => (product.stockBySize[size] ?? 0) > 0);
  const visibleColors = product.colors.filter(Boolean).slice(0, 4);
  const displayBadge = !hasStock
    ? {
        label: "SOLD OUT",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
      }
    : product.badge;

  return (
    <article className={`group w-full ${className ?? ""}`}>
      <Link
        href={`/products/${product.id}`}
        aria-label={`Ver producto ${product.name}`}
        className="block w-full text-left"
        onMouseEnter={hoverImage ? () => setShowHoverImage(true) : undefined}
        onMouseLeave={hoverImage ? () => setShowHoverImage(false) : undefined}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-zinc-900">
          {hasImage ? (
            <ProductImage
              key={displayImage}
              src={displayImage}
              alt={product.name}
              fill
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.02] sm:p-6"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}

          {displayBadge ? (
            <span
              className="absolute left-3 top-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: displayBadge.backgroundColor,
                color: displayBadge.textColor,
              }}
            >
              {displayBadge.label}
            </span>
          ) : null}
        </div>

        <div className="pt-3">
          <h3 className="text-sm font-semibold leading-snug text-gray-950 transition-colors group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
            {product.name}
          </h3>

          <ProductPrice
            price={product.price}
            oldPrice={product.oldPrice}
            small
            align="left"
            className="mt-1"
          />

          {visibleColors.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5" aria-label="Colores disponibles">
              {visibleColors.map((color, index) => (
                <span
                  key={`${color}-${index}`}
                  title={color}
                  className="h-2.5 w-2.5 rounded-full border border-black/20 bg-neutral-300 dark:border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      {hasStock ? (
        <Button
          asChild
          className="mt-3 h-9 w-full rounded-none bg-black text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-none transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <Link href={`/products/${product.id}`}>Comprar ahora</Link>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          className="mt-3 h-9 w-full rounded-none border border-zinc-300 bg-transparent text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 shadow-none opacity-100 disabled:pointer-events-none disabled:opacity-100 dark:border-zinc-700 dark:text-zinc-400"
        >
          Agotado
        </Button>
      )}
    </article>
  );
};
