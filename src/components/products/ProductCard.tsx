"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCartStore } from "@/store/cart";
import Image from "next/image";

interface ProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

export const ProductCard = ({ product }: ProductProps) => {
    const addToCart = useCartStore((state) => state.addToCart);
  return (
    <Card className="w-full shadow-md rounded-md bg-white">
      <CardContent className="p-4 flex flex-col items-center">
        {/* Contenedor estándar para imágenes */}
        <div className="relative w-full h-[400px] overflow-hidden rounded-md">
          <Image
            src={product.image}
            alt={product.name}
            layout="fill"
            objectFit="cover" // Ajusta sin deformar
            className="rounded-md"
          />
        </div>
        <h3 className="mt-4 text-lg font-bold text-center">{product.name}</h3>
        <p className="text-gray-600">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter>
      <Button className="w-full" onClick={() => addToCart({ ...product, quantity: 1 })}>Añadir al carrito</Button>
      </CardFooter>
    </Card>
  );
};
