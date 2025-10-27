"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface ProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    stockBySize: { [size: string]: number };
    sizes: string[];
    colors: string[];
  };
  className?: string;
}

export const ProductCard = ({ product, className }: ProductProps) => {
  const mainImage = product.images[0];
  
  // Verificar si hay stock en alguna talla
  const hasStock = product.sizes.some(size => product.stockBySize[size] > 0);

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full shadow-lg rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <CardContent className="p-0 flex flex-col cursor-pointer">
            {/* Contenedor de imagen */}
            <div className="relative w-full h-[360px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
              />
              {/* Mostrar sold out si no hay stock en ninguna talla */}
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

            {/* Información del producto */}
            <div className="p-4 space-y-3">
              <h3 className="text-base sm:text-base md:text-lg font-bold text-center group-hover:text-gray-800 dark:group-hover:text-gray-200 text-gray-900 dark:text-white transition-colors">
                {product.name}
              </h3>
              
              {/* Precio */}
              <p className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
};