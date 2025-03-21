"use client";

import { montserrat, nyghtSerif } from "@/app/fonts"; // Importa la fuente Montserrat
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface ProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    images: string[]; // Ahora es un array de imágenes
    stockBySize: { [size: string]: number }; // Stock por tamaño
    sizes: string[];
    colors: string[];
  };
}

export const ProductCard = ({ product }: ProductProps) => {
  // Verificar si todas las tallas están agotadas
  const isCompletelyOutOfStock = Object.values(product.stockBySize).every(
    (stock) => stock === 0
  );

  // Usar la primera imagen como imagen principal
  const mainImage = product.images[0];

  return (
    <Card className={`w-full shadow-md rounded-md bg-white ${montserrat.className}`}>
      {/* Envuelve el contenido de la tarjeta con Link */}
      <Link href={`/products/${product.id}`}>
        <CardContent className="p-4 flex flex-col items-center cursor-pointer">
          {/* Contenedor estándar para imágenes */}
          <div className="relative w-full h-[400px] overflow-hidden rounded-md">
            <Image
              src={mainImage} // Usar la primera imagen del array
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
            {/* Mostrar imagen de "Agotado" si todas las tallas están agotadas */}
            {isCompletelyOutOfStock && (
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
          {/* Nombre y precio del producto */}
          <h3 className={`mt-4 text-lg font-bold text-center ${nyghtSerif.className}`}>
            {product.name}
          </h3>
          <p className="text-gray-600">${product.price.toFixed(2)}</p>
        </CardContent>
      </Link>
    </Card>
  );
};