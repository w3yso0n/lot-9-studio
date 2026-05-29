"use client";

import { poppins } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog-product";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import {
  getProductImageDisplayUrl,
  sanitizeProductImagePaths,
} from "@/lib/product-image-url";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useMemo, useReducer, useState } from "react";
import { ProductPrice } from "@/components/products/ProductPrice";

/** Evita montar decenas de miniaturas a la vez en productos con muchas fotos. */
const MAX_THUMBNAILS = 20;

function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function sizesForStock(stock: Record<string, number>): string[] {
  const keys = Object.keys(stock);
  return [
    ...CATALOG_SIZE_ORDER.filter((s) => keys.includes(s)),
    ...keys.filter(
      (k) => !(CATALOG_SIZE_ORDER as readonly string[]).includes(k)
    ),
  ];
}

type ColorOption = {
  id: string;
  label: string;
  thumb: string;
  images: string[];
  stockBySize: Record<string, number>;
};

type LinkedSwatch = {
  id: number;
  name: string;
  color: string;
  image: string;
  current: boolean;
};

function buildColorOptions(product: CatalogProduct): ColorOption[] {
  if ((product.colorVariants?.length ?? 0) > 0) {
    return (product.colorVariants ?? [])
      .map((variant, index) => {
        const images = sanitizeProductImagePaths(variant.images);
        return {
          id: `color-${index}`,
          label: variant.label || `Color ${index + 1}`,
          thumb: images[0] ?? "",
          images,
          stockBySize: variant.stockBySize ?? {},
        };
      })
      .filter((v) => v.images.length > 0);
  }

  const baseImages = sanitizeProductImagePaths(product.images ?? []);
  if (baseImages.length === 0) return [];

  return [
    {
      id: "main",
      label: product.color || "Color principal",
      thumb: baseImages[0],
      images: baseImages,
      stockBySize: product.stockBySize ?? {},
    },
  ];
}

type DetailState = {
  colorIndex: number;
  mainImageIndex: number;
  selectedSize: string | null;
};

type DetailAction =
  | { type: "select-color"; index: number }
  | { type: "select-thumb"; index: number }
  | { type: "select-size"; size: string };

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case "select-color":
      return {
        colorIndex: action.index,
        mainImageIndex: 0,
        selectedSize: null,
      };
    case "select-thumb":
      return { ...state, mainImageIndex: action.index };
    case "select-size":
      return { ...state, selectedSize: action.size };
    default:
      return state;
  }
}

const ThumbButton = memo(function ThumbButton({
  src,
  alt,
  selected,
  onClick,
}: {
  src: string;
  alt: string;
  selected: boolean;
  onClick: () => void;
}) {
  const url = getProductImageDisplayUrl(src, "thumb");
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 cursor-pointer bg-muted/40",
        selected
          ? "border-foreground"
          : "border-border hover:border-muted-foreground"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </button>
  );
});

const ColorSwatch = memo(function ColorSwatch({
  label,
  thumb,
  selected,
  onSelect,
}: {
  label: string;
  thumb: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const url = getProductImageDisplayUrl(thumb, "swatch");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative block h-16 w-16 shrink-0 overflow-hidden border-2 bg-background",
        selected
          ? "border-foreground"
          : "border-border hover:border-muted-foreground"
      )}
      title={label}
      aria-label={label}
      aria-pressed={selected}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1"
        />
      ) : null}
    </button>
  );
});

type Props = { product: CatalogProduct };

export function ProductDetailClient({ product }: Props) {
  const hasColorVariants = (product.colorVariants?.length ?? 0) > 0;
  const colorOptions = useMemo(() => buildColorOptions(product), [product]);

  const linkedSwatches = useMemo((): LinkedSwatch[] => {
    if (hasColorVariants) return [];
    const images = sanitizeProductImagePaths(product.images ?? []);
    return [
      {
        id: product.id,
        name: product.name,
        color: product.color,
        image: images[0] ?? "",
        current: true,
      },
      ...(product.variants ?? []).map((v) => ({ ...v, current: false })),
    ];
  }, [product, hasColorVariants]);

  const [state, dispatch] = useReducer(detailReducer, {
    colorIndex: 0,
    mainImageIndex: 0,
    selectedSize: null,
  });
  const addToCart = useCartStore((s) => s.addToCart);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const safeColorIndex =
    colorOptions.length > 0
      ? Math.min(state.colorIndex, colorOptions.length - 1)
      : 0;
  const active = colorOptions[safeColorIndex];
  const activeImages = active?.images ?? [];
  const safeMainIndex = Math.min(
    state.mainImageIndex,
    Math.max(0, activeImages.length - 1)
  );
  const mainImage = activeImages[safeMainIndex] ?? activeImages[0] ?? "";
  const activeStock = active?.stockBySize ?? product.stockBySize ?? {};
  const activeLabel = active?.label ?? product.color ?? "Color principal";

  const displaySizes = useMemo(() => {
    if (product.sizes.length > 0) return product.sizes;
    return sizesForStock(activeStock);
  }, [product.sizes, activeStock]);

  const isOutOfStock =
    state.selectedSize != null && (activeStock[state.selectedSize] ?? 0) === 0;

  const showOldPrice =
    product.oldPrice != null &&
    product.oldPrice > 1 &&
    product.oldPrice > product.price;

  const mainDisplaySrc = mainImage
    ? getProductImageDisplayUrl(mainImage, "main")
    : "";

  const { thumbIndices, hiddenThumbCount } = useMemo(() => {
    if (activeImages.length <= MAX_THUMBNAILS) {
      return {
        thumbIndices: activeImages.map((_, i) => i),
        hiddenThumbCount: 0,
      };
    }
    const indices = new Set<number>();
    for (let i = 0; i < MAX_THUMBNAILS - 1; i++) indices.add(i);
    indices.add(safeMainIndex);
    const sorted = [...indices].sort((a, b) => a - b);
    return {
      thumbIndices: sorted,
      hiddenThumbCount: activeImages.length - sorted.length,
    };
  }, [activeImages, safeMainIndex]);

  return (
    <section
      className={cn("container mx-auto py-12 px-4 sm:px-6 lg:px-8", poppins.className)}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:gap-10">
        {/* Galería: miniaturas a la izquierda + foto grande (como el resto de productos) */}
        <div className="grid min-w-0 gap-4 xl:grid-cols-[96px_minmax(0,1fr)] xl:items-start">
          {thumbIndices.length > 0 ? (
            <div
              className="order-2 flex gap-3 overflow-x-auto p-1 xl:order-1 xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:max-h-[min(76vh,640px)]"
              aria-label="Miniaturas"
            >
              {thumbIndices.map((imageIndex) => (
                <ThumbButton
                  key={`${safeColorIndex}-${activeImages[imageIndex]}-${imageIndex}`}
                  src={activeImages[imageIndex] ?? ""}
                  alt={`${product.name} - ${imageIndex + 1}`}
                  selected={safeMainIndex === imageIndex}
                  onClick={() =>
                    dispatch({ type: "select-thumb", index: imageIndex })
                  }
                />
              ))}
              {hiddenThumbCount > 0 ? (
                <p className="shrink-0 self-center px-1 text-xs text-muted-foreground xl:max-w-[5rem] xl:text-center">
                  +{hiddenThumbCount} fotos más
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="order-1 relative mx-auto w-full max-w-[min(100%,620px)] aspect-[4/5] min-h-[260px] overflow-hidden rounded-lg bg-muted xl:order-2 xl:max-w-none xl:min-h-0">
            {mainDisplaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={mainImage}
                src={mainDisplaySrc}
                alt={product.name}
                decoding="async"
                fetchPriority={
                  safeColorIndex === 0 && safeMainIndex === 0 ? "high" : "auto"
                }
                className="absolute inset-0 h-full w-full object-contain p-1 sm:p-2"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Sin imagen
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 pointer-events-none">
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
        </div>

        {/* Información del producto */}
        <div className="w-full max-w-2xl mx-auto space-y-6 xl:mx-0 xl:max-w-[420px] xl:self-start xl:sticky xl:top-24">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{activeLabel}</p>

            <div className="mt-2 max-w-[20rem]">
              <ProductPrice price={product.price} oldPrice={product.oldPrice} align="left" />
            </div>
          </div>

          {colorOptions.length > 1 ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Color</h2>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((option, index) => (
                  <ColorSwatch
                    key={option.id}
                    label={option.label}
                    thumb={option.thumb}
                    selected={safeColorIndex === index}
                    onSelect={() => dispatch({ type: "select-color", index })}
                  />
                ))}
              </div>
            </div>
          ) : linkedSwatches.length > 1 ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Variantes</h2>
              <div className="flex flex-wrap gap-3">
                {linkedSwatches.map((variant) => {
                  const inner = (
                    <span
                      className={cn(
                        "relative block h-16 w-16 overflow-hidden border-2 bg-background",
                        variant.current
                          ? "border-foreground"
                          : "border-border hover:border-muted-foreground"
                      )}
                      title={variant.color || variant.name}
                    >
                      {variant.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getProductImageDisplayUrl(variant.image, "swatch")}
                          alt=""
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                          {variant.color || "Color"}
                        </span>
                      )}
                    </span>
                  );
                  return variant.current ? (
                    <span key={variant.id} aria-current="true">
                      {inner}
                    </span>
                  ) : (
                    <Link key={variant.id} href={`/products/${variant.id}`}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            {displaySizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tallas configuradas para este producto.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displaySizes.map((size) => {
                  const qty = activeStock[size] ?? 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => dispatch({ type: "select-size", size })}
                      className={cn(
                        "rounded-lg border px-4 py-2 transition-colors",
                        state.selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : qty === 0
                            ? "border-border text-muted-foreground line-through"
                            : "border-border hover:bg-muted"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Stock disponible</h2>
            <p className="text-muted-foreground">
              {state.selectedSize
                ? (activeStock[state.selectedSize] ?? 0) > 0
                  ? `Stock: ${activeStock[state.selectedSize]}`
                  : "Agotado"
                : "Selecciona una talla"}
            </p>
          </div>

          {product.desc?.trim() ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Descripción</h2>
              <p className="text-muted-foreground">{product.desc.trim()}</p>
            </div>
          ) : null}

          <motion.div
            animate={justAdded ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Button
              className={cn(
                "w-full sm:w-auto transition-colors duration-300",
                justAdded
                  ? "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-600"
                  : "bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              )}
              disabled={!state.selectedSize || isOutOfStock}
              onClick={() => {
                if (!state.selectedSize || isOutOfStock) return;
                addToCart(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    images: activeImages.length > 0 ? activeImages : product.images,
                    quantity: 1,
                    color: activeLabel,
                  },
                  state.selectedSize,
                  activeLabel
                );
                setJustAdded(true);
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {justAdded ? (
                  <motion.span
                    key="added"
                    className="inline-flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="size-4 shrink-0" aria-hidden />
                    Agregado al carrito
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {state.selectedSize
                      ? isOutOfStock
                        ? "Agotado"
                        : "Añadir al carrito"
                      : "Selecciona una talla"}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
