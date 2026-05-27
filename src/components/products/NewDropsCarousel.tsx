"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductImage } from "@/components/products/ProductImage";
import type { CatalogProduct } from "@/lib/catalog-product";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

type Props = { newDrops: CatalogProduct[] };

const NewDropsCarousel = ({ newDrops }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<number, number>>({});

  if (newDrops.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % newDrops.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + newDrops.length) % newDrops.length);
  };

  return (
    <section
      id="nuevos-drops"
      className="relative container mx-auto py-8 sm:py-12 md:py-16 px-3 sm:px-4 scroll-mt-24"
    >
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-sm font-medium tracking-widest text-primary mb-2 block">
          COLECCIÓN EXCLUSIVA
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          Nuevos Drops
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubre nuestras últimos diseños
        </p>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {newDrops.map((product) => {
              const currentImageIndex = selectedImageIndex[product.id] || 0;
              const slideImage =
                product.images[currentImageIndex] ?? product.images[0];
              const mainProduct = {
                ...product,
                images: slideImage ? [slideImage] : [],
                coverImage: slideImage || product.coverImage,
                hoverImage: null,
              };

              return (
                <div key={product.id} className="w-full shrink-0 px-2 relative">
                  <div className="max-w-sm mx-auto pb-20 space-y-12">
                    <ProductCard product={mainProduct} className="shadow-xl" />

                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex gap-2 justify-center px-4 pb-6">
                        {product.images.map((img, imgIndex) => (
                          <button
                            key={imgIndex}
                            type="button"
                            onClick={() =>
                              setSelectedImageIndex((prev) => ({
                                ...prev,
                                [product.id]: imgIndex,
                              }))
                            }
                            className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                              currentImageIndex === imgIndex
                                ? "border-primary"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                            }`}
                          >
                            <ProductImage
                              src={img}
                              alt={`${product.name} - Imagen ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center items-center mt-6 sm:mt-8 gap-4">
          <button
            type="button"
            onClick={prevSlide}
            className="bg-white/90 dark:bg-gray-800/90 p-2 sm:p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white transition-colors"
            aria-label="Anterior"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex gap-2">
            {newDrops.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                  currentIndex === index ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="bg-white/90 dark:bg-gray-800/90 p-2 sm:p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white transition-colors"
            aria-label="Siguiente"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          {currentIndex + 1} de {newDrops.length}
        </p>
      </div>
    </section>
  );
};

export default NewDropsCarousel;
