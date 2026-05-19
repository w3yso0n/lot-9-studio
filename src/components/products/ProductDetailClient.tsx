"use client";

import { poppins } from "@/app/fonts";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog-product";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import {
  encodeProductImagePath,
  sanitizeProductImagePaths,
} from "@/lib/product-image-url";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useMemo,
  useReducer,
  useTransition,
} from "react";

function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function sizesForStock(
  stock: Record<string, number>,
  fallback: string[]
): string[] {
  if (fallback.length > 0) return fallback;
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
  const baseImages = sanitizeProductImagePaths(product.images ?? []);

  if ((product.colorVariants?.length ?? 0) > 0) {
    return (product.colorVariants ?? [])
      .map((variant, index) => {
        const images = sanitizeProductImagePaths(variant.images);
        return {
          id: `color-${index}`,
          label: variant.label || `Color ${index + 1}`,
          thumb: images[0] ?? "",
          images,
          stockBySize: variant.stockBySize,
        };
      })
      .filter((v) => v.thumb);
  }

  if (baseImages[0]) {
    return [
      {
        id: "main",
        label: product.color || "Color principal",
        thumb: baseImages[0],
        images: baseImages,
        stockBySize: product.stockBySize,
      },
    ];
  }

  return [];
}

function preloadImage(src: string) {
  const url = encodeProductImagePath(src);
  if (!url || typeof window === "undefined") return;
  const img = new window.Image();
  img.src = url;
}

type DetailState = {
  colorIndex: number;
  mainImageIndex: number;
  selectedSize: string | null;
};

type DetailAction =
  | { type: "select-color"; index: number }
  | { type: "select-thumb"; index: number }
  | { type: "select-size"; size: string }
  | { type: "clear-size" };

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
    case "clear-size":
      return { ...state, selectedSize: null };
    default:
      return state;
  }
}

/** Miniatura: img nativo (más ligero que next/image en listas). */
const ThumbImg = memo(function ThumbImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const url = encodeProductImagePath(src);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
});

const ColorSwatch = memo(function ColorSwatch({
  label,
  thumb,
  selected,
  onSelect,
  onPrefetch,
}: {
  label: string;
  thumb: string;
  selected: boolean;
  onSelect: () => void;
  onPrefetch: () => void;
}) {
  const url = encodeProductImagePath(thumb);
  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={onPrefetch}
      className={`relative block h-16 w-16 shrink-0 overflow-hidden border bg-white ${
        selected ? "border-black" : "border-gray-200 hover:border-gray-500"
      }`}
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

const MainImage = memo(function MainImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <ProductImage
      src={src}
      alt={alt}
      fill
      className="rounded-lg object-cover"
      sizes="(max-width: 768px) 100vw, 448px"
      priority={priority}
    />
  );
});

type Props = { product: CatalogProduct };

export function ProductDetailClient({ product }: Props) {
  const colorOptions = useMemo(() => buildColorOptions(product), [product]);
  const linkedSwatches = useMemo((): LinkedSwatch[] => {
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
  }, [product]);

  const [state, dispatch] = useReducer(detailReducer, {
    colorIndex: 0,
    mainImageIndex: 0,
    selectedSize: null,
  });
  const [, startTransition] = useTransition();
  const addToCart = useCartStore((s) => s.addToCart);

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
  const activeStock = active?.stockBySize ?? product.stockBySize;
  const activeLabel = active?.label ?? product.color ?? "Color principal";

  const displaySizes = useMemo(
    () => sizesForStock(activeStock, product.sizes),
    [activeStock, product.sizes]
  );

  const isOutOfStock =
    state.selectedSize != null && (activeStock[state.selectedSize] ?? 0) === 0;

  const showOldPrice =
    product.oldPrice != null &&
    product.oldPrice > 1 &&
    product.oldPrice > product.price;

  const selectColor = useCallback((index: number) => {
    startTransition(() => {
      dispatch({ type: "select-color", index });
    });
  }, []);

  const prefetchColor = useCallback(
    (index: number) => {
      const option = colorOptions[index];
      if (!option) return;
      for (const src of option.images.slice(0, 4)) {
        preloadImage(src);
      }
    },
    [colorOptions]
  );

  return (
    <section
      className={`container mx-auto py-12 px-4 sm:px-6 lg:px-8 ${poppins.className}`}
    >
      <div className="flex flex-col md:flex-row gap-8">
        {activeImages.length > 1 ? (
          <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1 p-4 overflow-x-auto md:overflow-visible max-h-[120px] md:max-h-none">
            {activeImages.map((img, index) => (
              <button
                key={img}
                type="button"
                onClick={() => dispatch({ type: "select-thumb", index })}
                className={`relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border cursor-pointer ${
                  safeMainIndex === index
                    ? "border-black"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <ThumbImg
                  src={img}
                  alt={`${product.name} - ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative w-full max-w-md h-[min(70vh,500px)] order-1 md:order-2 p-4 mx-auto">
          {mainImage ? (
            <MainImage
              src={mainImage}
              alt={product.name}
              priority={safeColorIndex === 0 && safeMainIndex === 0}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
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

        <div className="max-w-lg order-3 p-4">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-500 text-sm mb-1">{activeLabel}</p>

          <div className="flex items-center gap-2 mb-1">
            {showOldPrice && (
              <span className="text-sm font-medium text-gray-500 line-through">
                ${formatPrice(product.oldPrice ?? 0)}
              </span>
            )}
            <span className="text-gray-900 text-xl font-bold">
              ${formatPrice(product.price)}
            </span>
          </div>

          {colorOptions.length > 1 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {colorOptions.map((option, index) => (
                <ColorSwatch
                  key={option.id}
                  label={option.label}
                  thumb={option.thumb}
                  selected={safeColorIndex === index}
                  onSelect={() => selectColor(index)}
                  onPrefetch={() => prefetchColor(index)}
                />
              ))}
            </div>
          ) : linkedSwatches.length > 1 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {linkedSwatches.map((variant) => {
                const inner = (
                  <span
                    className={`relative block h-16 w-16 overflow-hidden border bg-white ${
                      variant.current
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-500"
                    }`}
                    title={variant.color || variant.name}
                  >
                    {variant.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={encodeProductImagePath(variant.image)}
                        alt=""
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-gray-500">
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
          ) : null}

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {displaySizes.map((size) => {
                const qty = activeStock[size] ?? 0;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "select-size", size })
                    }
                    className={`px-4 py-2 border rounded-lg ${
                      state.selectedSize === size
                        ? "bg-black text-white"
                        : qty === 0
                          ? "line-through text-gray-400"
                          : "border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Stock disponible</h2>
            <p className="text-gray-700">
              {state.selectedSize
                ? (activeStock[state.selectedSize] ?? 0) > 0
                  ? `Stock: ${activeStock[state.selectedSize]}`
                  : "Agotado"
                : "Selecciona una talla"}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700">{product.desc || "—"}</p>
          </div>

          <div className="mt-6">
            <Button
              className="w-full md:w-auto"
              disabled={!state.selectedSize || isOutOfStock}
              onClick={() => {
                if (!state.selectedSize) return;
                addToCart(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    images: activeImages,
                    quantity: 1,
                    color: activeLabel,
                  },
                  state.selectedSize,
                  activeLabel
                );
              }}
            >
              {state.selectedSize
                ? isOutOfStock
                  ? "Agotado"
                  : "Añadir al carrito"
                : "Selecciona una talla"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
