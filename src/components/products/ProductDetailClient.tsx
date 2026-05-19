"use client";

import { poppins } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog-product";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = { product: CatalogProduct };

export function ProductDetailClient({ product }: Props) {
  type LocalProduct = CatalogProduct & {
    quantity: number;
    selectedSize?: string;
  };

  const withQty = {
    ...product,
    images: product.images || [],
    quantity: 1,
  } as LocalProduct;

  const initialColorVariant = withQty.colorVariants?.[0];
  const initialImages =
    initialColorVariant?.images?.length ? initialColorVariant.images : withQty.images;
  const initialColorLabel =
    initialColorVariant?.label || withQty.color || "Color principal";
  const initialStockBySize =
    initialColorVariant?.stockBySize || withQty.stockBySize;

  const [activeImages, setActiveImages] = useState<string[]>(initialImages);
  const [mainImage, setMainImage] = useState(initialImages[0] ?? "");
  const [activeColorId, setActiveColorId] = useState(
    initialColorVariant ? `color-0-${initialColorVariant.images.join("~")}` : "main"
  );
  const [activeColorLabel, setActiveColorLabel] = useState(
    initialColorLabel
  );
  const [activeStockBySize, setActiveStockBySize] = useState(
    initialStockBySize
  );
  const [selectedSize, setSelectedSize] = useState<
    keyof LocalProduct["stockBySize"] | null
  >(null);

  const isOutOfStock = selectedSize
    ? activeStockBySize[selectedSize] === 0
    : false;

  const showOldPrice =
    withQty.oldPrice !== undefined &&
    withQty.oldPrice !== null &&
    withQty.oldPrice > 1 &&
    withQty.oldPrice > withQty.price;

  const addToCart = useCartStore((state) => state.addToCart);
  const linkedProductSwatches = [
    {
      id: withQty.id,
      name: withQty.name,
      color: withQty.color,
      image: withQty.images[0] ?? "",
      current: true,
    },
    ...(withQty.variants ?? []).map((variant) => ({
      ...variant,
      current: false,
    })),
  ];
  const colorImageSwatches =
    (withQty.colorVariants?.length ?? 0) > 0
      ? (withQty.colorVariants ?? [])
          .map((variant, index) => ({
            id: `color-${index}-${variant.images.join("~")}`,
            label: variant.label || `Color ${index + 1}`,
            image: variant.images[0] ?? "",
            images: variant.images,
            stockBySize: variant.stockBySize,
          }))
          .filter((variant) => variant.image)
      : [
          {
            id: "main",
            label: withQty.color || "Color principal",
            image: withQty.images[0] ?? "",
            images: withQty.images,
            stockBySize: withQty.stockBySize,
          },
        ].filter((variant) => variant.image);

  return (
    <section
      className={`container mx-auto py-12 px-4 sm:px-6 lg:px-8 ${poppins.className}`}
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1 p-4">
          {activeImages.map((img, index) => (
            <div
              key={index}
              className="relative w-20 h-20 md:w-24 md:h-24 cursor-pointer"
              onClick={() => setMainImage(img)}
            >
              <Image
                src={img}
                alt={`${withQty.name} - Imagen ${index + 1}`}
                fill
                className="rounded-lg object-cover border border-gray-200 hover:border-gray-400 transition"
              />
            </div>
          ))}
        </div>

        <div className="relative w-full max-w-md h-[500px] order-1 md:order-2 p-4">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={withQty.name}
              fill
              className="rounded-lg object-cover"
            />
          ) : null}

          {isOutOfStock && (
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

        <div className="max-w-lg order-3 p-4">
          <h1 className="text-3xl font-bold mb-4">{withQty.name}</h1>
          <p className="text-gray-500 text-sm mb-1">{activeColorLabel}</p>

          <div className="flex items-center gap-2 mb-1">
            {showOldPrice && (
              <span className="text-sm font-medium text-gray-500 line-through">
                ${withQty.oldPrice?.toFixed(2)}
              </span>
            )}

            <span className="text-gray-900 text-xl font-bold">
              ${withQty.price.toFixed(2)}
            </span>
          </div>

          {colorImageSwatches.length > 1 ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                {colorImageSwatches.map((variant) => {
                  const selected = activeColorId === variant.id;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setActiveColorId(variant.id);
                        setActiveColorLabel(variant.label);
                        setActiveImages(variant.images);
                        setActiveStockBySize(variant.stockBySize);
                        setMainImage(variant.images[0] ?? variant.image);
                        setSelectedSize(null);
                      }}
                      className={`relative block h-16 w-16 overflow-hidden border bg-white transition ${
                        selected
                          ? "border-black"
                          : "border-gray-200 hover:border-gray-500"
                      }`}
                      title={variant.label}
                      aria-label={variant.label}
                      aria-pressed={selected}
                    >
                      <Image
                        src={variant.image}
                        alt={variant.label}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                        unoptimized
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : linkedProductSwatches.length > 1 ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                {linkedProductSwatches.map((variant) => {
                  const content = (
                    <span
                      className={`relative block h-16 w-16 overflow-hidden border bg-white transition ${
                        variant.current
                          ? "border-black"
                          : "border-gray-200 hover:border-gray-500"
                      }`}
                      title={variant.color || variant.name}
                    >
                      {variant.image ? (
                        <Image
                          src={variant.image}
                          alt={variant.color || variant.name}
                          fill
                          className="object-contain p-1"
                          sizes="64px"
                          unoptimized
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
                      {content}
                    </span>
                  ) : (
                    <Link key={variant.id} href={`/products/${variant.id}`}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            <div className="flex gap-2">
              {withQty.sizes.map((size) => {
                const key = size as keyof typeof withQty.stockBySize;
                const isSizeOutOfStock = (activeStockBySize[key] ?? 0) === 0;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(key)}
                    className={`px-4 py-2 border rounded-lg ${
                      selectedSize === key
                        ? "bg-black text-white"
                        : isSizeOutOfStock
                          ? "line-through text-gray-400 "
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
              {selectedSize
                ? (activeStockBySize[selectedSize] ?? 0) > 0
                  ? `Stock: ${activeStockBySize[selectedSize]}`
                  : "Agotado"
                : "Selecciona una talla"}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700">{withQty.desc || "—"}</p>
          </div>

          <div className="mt-6">
            <Button
              className="w-full md:w-auto"
              disabled={!selectedSize || isOutOfStock}
              onClick={() => {
                if (selectedSize) {
                  addToCart(
                    {
                      ...withQty,
                      color: activeColorLabel,
                      images: activeImages,
                    },
                    selectedSize,
                    activeColorLabel
                  );
                }
              }}
            >
              {selectedSize
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
