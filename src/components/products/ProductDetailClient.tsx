"use client";

import { poppins } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog-product";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
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

  const [mainImage, setMainImage] = useState(withQty.images[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<keyof LocalProduct["stockBySize"] | null>(null);

  const isOutOfStock = selectedSize ? withQty.stockBySize[selectedSize] === 0 : false;
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <section className={`container mx-auto py-12 px-4 sm:px-6 lg:px-8 ${poppins.className}`}>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1 p-4">
          {withQty.images.map((img, index) => (
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
          <p className="text-gray-500 text-sm mb-1">{withQty.color}</p>
          <p className="text-gray-600 text-lg">${withQty.price.toFixed(2)}</p>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            <div className="flex gap-2">
              {withQty.sizes.map((size) => {
                const key = size as keyof typeof withQty.stockBySize;
                const isSizeOutOfStock = (withQty.stockBySize[key] ?? 0) === 0;
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
                ? (withQty.stockBySize[selectedSize] ?? 0) > 0
                  ? `Stock: ${withQty.stockBySize[selectedSize]}`
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
                  addToCart(withQty, selectedSize);
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
