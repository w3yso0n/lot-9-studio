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

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full shadow-lg rounded-xl bg-white overflow-hidden">
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
            </div>

            {/* Información del producto */}
            <div className="p-4 space-y-3">
              <h3 className="text-base sm:text-base md:text-lg font-bold text-center group-hover:text-gray-800 transition-colors">
                {product.name}
              </h3>
              
              {/* Indicadores de disponibilidad */}
              <div className="flex justify-center space-x-2">
                {product.sizes.slice(0, 3).map((size) => {
                  const isAvailable = product.stockBySize[size] > 0;
                  return (
                    <span
                      key={size}
                      className={`text-sm px-2 py-1 rounded-full ${
                        isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {size}
                    </span>
                  );
                })}
                {product.sizes.length > 3 && (
                  <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    +{product.sizes.length - 3}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
};