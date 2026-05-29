"use client";

import { HomeImageCarousel } from "@/components/home/HomeImageCarousel";
import { useEffect, useRef, useState } from "react";

type CarouselImage = {
  url: string;
  alt?: string;
  link?: string;
};

type Props = {
  images: CarouselImage[];
  title: string;
  speed: number;
  direction: "left" | "right";
};

/** Monta el carrusel solo cuando entra en viewport (menos JS/hydration above-the-fold). */
export function HomeImageCarouselLazy(props: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="min-h-[min(76vw,340px)]">
      {visible ? (
        <HomeImageCarousel {...props} />
      ) : (
        <div
          className="h-[min(76vw,340px)] max-h-[340px] w-full animate-pulse bg-muted"
          aria-hidden
        />
      )}
    </div>
  );
}
