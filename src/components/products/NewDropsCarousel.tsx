"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog-product";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { newDrops: CatalogProduct[] };

const NewDropsCarousel = ({ newDrops }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<number, number>>({});

  useEffect(() => {
    if (newDrops.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newDrops.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [newDrops.length]);

  if (newDrops.length === 0) {
    return null;
  }

  if (newDrops.length === 1) {
    return (
      <section
        id="nuevos-drops"
        className="relative mx-auto w-full py-4 scroll-mt-24 sm:py-6"
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              New Drop
            </span>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Compra ahora
            </h2>
          </div>

          <Button asChild variant="outline" className="hidden rounded-none sm:inline-flex">
            <Link href="/products#catalogo">Ver productos</Link>
          </Button>
        </div>

        <div className="max-w-sm">
          <ProductCard product={newDrops[0]} />
        </div>
      </section>
    );
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
      className="relative mx-auto w-full px-0 py-6 scroll-mt-24 sm:py-8"
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Colección exclusiva
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Nuevos Drops
          </h2>
        </div>

        <Button asChild variant="outline" className="hidden rounded-none sm:inline-flex">
          <Link href="/products#catalogo">Ver productos</Link>
        </Button>
      </div>

      <div className="relative">
        <div className="overflow-hidden">
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
                <div key={product.id} className="relative w-full shrink-0 px-2">
                  <div className="mx-auto max-w-sm space-y-8 pb-16">
                    <ProductCard product={mainProduct} />

                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-4 pb-4">
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
                            className={`relative h-12 w-12 overflow-hidden border transition-colors sm:h-16 sm:w-16 ${
                              currentImageIndex === imgIndex
                                ? "border-foreground"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <ProductImage
                              src={img}
                              displaySize="swatch"
                              alt={`${product.name} - Imagen ${imgIndex + 1}`}
                              fill
                              className="bg-neutral-100 object-contain p-1 dark:bg-zinc-900"
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

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prevSlide}
            className="border border-border bg-background/90 p-2 transition-colors hover:bg-foreground hover:text-background"
            aria-label="Anterior"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <div className="flex gap-2">
            {newDrops.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors sm:h-3 sm:w-3 ${
                  currentIndex === index ? "bg-foreground" : "bg-muted-foreground/40"
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="border border-border bg-background/90 p-2 transition-colors hover:bg-foreground hover:text-background"
            aria-label="Siguiente"
          >
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {currentIndex + 1} de {newDrops.length}
        </p>
      </div>
    </section>
  );
};

export default NewDropsCarousel;
