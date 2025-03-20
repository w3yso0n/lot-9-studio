"use client";

import { Button } from "@/components/ui/button";
import { products } from "@/lib/data";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useState } from "react";

export default function ProductPage({ params }: any) {
  const { id } = params;

  const product = products.find((p) => p.id === parseInt(id, 10)) as {
    id: number;
    name: string;
    price: number;
    image: string;
    sizes: ("S" | "M" | "L" | "XL")[];
    stockBySize: {
      S: number;
      M: number;
      L: number;
      XL: number;
    };
  };

  if (!product) return notFound(); // Si el producto no existe, devuelve un 404

  // Simulación de imágenes adicionales (misma imagen repetida)
  const additionalImages = Array(5).fill(product.image);

  // Estado para manejar la imagen principal
  const [mainImage, setMainImage] = useState(product.image);

  // Estado para manejar la talla seleccionada
  const [selectedSize, setSelectedSize] = useState<keyof typeof product.stockBySize | null>(null);

  // Verificar si el producto está agotado para la talla seleccionada
  const isOutOfStock = selectedSize
    ? product.stockBySize[selectedSize] === 0
    : false;

  return (
    <section className="container mx-auto py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Columna de imágenes adicionales */}
        <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1">
          {additionalImages.map((img, index) => (
            <div
              key={index}
              className="relative w-20 h-20 md:w-24 md:h-24 cursor-pointer"
              onClick={() => setMainImage(img)} // Cambia la imagen principal al hacer clic
            >
              <Image
                src={img}
                alt={`${product.name} - Imagen ${index + 1}`}
                fill
                className="rounded-lg object-cover border border-gray-200 hover:border-gray-400 transition"
              />
            </div>
          ))}
        </div>

        {/* Imagen principal del producto */}
        <div className="relative w-full max-w-md h-[500px] order-1 md:order-2">
          <Image
            src={mainImage} // Usa la imagen principal del estado
            alt={product.name}
            fill
            className="rounded-lg object-cover"
          />
          {/* Mostrar imagen de "Agotado" si no hay stock para la talla seleccionada */}
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

        {/* Detalles del producto */}
        <div className="max-w-lg order-3">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 text-lg">${product.price.toFixed(2)}</p>

          {/* Tamaños disponibles */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            <div className="flex gap-2">
              {product.sizes.map((size: keyof typeof product.stockBySize) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded-lg ${
                    selectedSize === size
                      ? "bg-black text-white"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stock disponible */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Stock disponible</h2>
            <p className="text-gray-700">
              {selectedSize
                ? product.stockBySize[selectedSize] > 0
                  ? `Stock: ${product.stockBySize[selectedSize]}`
                  : "Agotado"
                : "Selecciona una talla"}
            </p>
          </div>

          {/* Descripción del producto */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin et nunc nec velit suscipit sollicitudin.
            </p>
          </div>

          {/* Botón de añadir al carrito */}
          <div className="mt-6">
            <Button
              className="w-full md:w-auto"
              disabled={!selectedSize || isOutOfStock} // Deshabilitar si no hay talla seleccionada o no hay stock
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