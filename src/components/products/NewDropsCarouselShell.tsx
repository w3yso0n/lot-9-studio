"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Children, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  slideCount: number;
};

function ArrowLeftIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NewDropsCarouselShell({ children, slideCount }: Props) {
  const slides = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [slideCount]);

  if (slideCount === 0 || slides.length === 0) return null;

  if (slideCount === 1) {
    return (
      <section id="nuevos-drops" className="relative mx-auto w-full py-4 scroll-mt-24 sm:py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              New Drop
            </span>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Compra ahora</h2>
          </div>
          <Button asChild variant="outline" className="hidden rounded-none sm:inline-flex">
            <Link href="/products#catalogo">Ver productos</Link>
          </Button>
        </div>
        <div className="max-w-sm">{slides[0]}</div>
      </section>
    );
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slideCount);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);

  return (
    <section id="nuevos-drops" className="relative mx-auto w-full px-0 py-6 scroll-mt-24 sm:py-8">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Colección exclusiva
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevos Drops</h2>
        </div>
        <Button asChild variant="outline" className="hidden rounded-none sm:inline-flex">
          <Link href="/products#catalogo">Ver productos</Link>
        </Button>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.key ?? index} className="w-full shrink-0 px-2">
              <div className="mx-auto max-w-sm">{slide}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prevSlide}
          className="border border-border bg-background/90 p-2 transition-colors hover:bg-foreground hover:text-background"
          aria-label="Anterior"
        >
          <ArrowLeftIcon />
        </button>
        <div className="flex gap-2">
          {Array.from({ length: slideCount }).map((_, index) => (
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
          <ArrowRightIcon />
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {currentIndex + 1} de {slideCount}
      </p>
    </section>
  );
}
