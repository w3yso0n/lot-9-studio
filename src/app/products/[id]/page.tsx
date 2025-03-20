"use client"; // Asegúrate de agregar esto para usar hooks de React

import { Button } from "@/components/ui/button";
import { products } from "@/lib/data";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useState } from "react"; // Importa useState

export default function ProductPage({ params }:any) {
  // Desempaqueta params usando React.use()
  const { id } = params;

  const product = products.find((p) => p.id === parseInt(id, 10));

  if (!product) return notFound(); // Si el producto no existe, devuelve un 404

  // Simulación de imágenes adicionales (misma imagen repetida)
  const additionalImages = Array(5).fill(product.image);
  additionalImages[0] = "/images/souls.png";

  // Estado para manejar la imagen principal
  const [mainImage, setMainImage] = useState(product.image);

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
        </div>

        {/* Detalles del producto */}
        <div className="max-w-lg order-3">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 text-lg">${product.price.toFixed(2)}</p>

          {/* Tamaños disponibles */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tamaños disponibles</h2>
            <div className="flex gap-2">
              {["S", "M", "L", "XL"].map((size) => (
                <button
                  key={size}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stock disponible */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Stock disponible</h2>
            <p className="text-gray-700">10 unidades en stock</p>
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
            <Button className="w-full md:w-auto">Añadir al carrito</Button>
          </div>
        </div>
      </div>
    </section>
  );
}