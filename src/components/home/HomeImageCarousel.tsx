"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

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

export function HomeImageCarousel({ images, title, speed, direction }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;

    let frame = 0;
    let lastTime = performance.now();
    let offset = 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = Math.max(14, Math.min(90, speed)) * (prefersReducedMotion ? 2000 : 1000);

    const animate = (time: number) => {
      const loopWidth = track.scrollWidth / 2;
      if (loopWidth > 0) {
        const delta = time - lastTime;
        offset = (offset + (delta / duration) * loopWidth) % loopWidth;
        const signedOffset = direction === "right" ? offset - loopWidth : -offset;
        track.style.transform = `translate3d(${signedOffset}px, 0, 0)`;
      }

      lastTime = time;
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frame);
  }, [direction, images.length, speed]);

  const loopImages = [
    ...images.map((image) => ({ ...image, isDuplicate: false })),
    ...images.map((image) => ({ ...image, isDuplicate: true })),
  ];

  return (
    <div className="home-marquee w-full overflow-hidden" data-home-image-carousel>
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform">
        {loopImages.map((image, index) => {
          const tile = (
            <div className="relative aspect-[4/5] w-[76vw] shrink-0 overflow-hidden bg-neutral-100 sm:w-[42vw] lg:w-[28vw] xl:w-[340px]">
              <Image
                src={image.url}
                alt={image.isDuplicate ? "" : image.alt ?? title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, (max-width: 1280px) 28vw, 340px"
                unoptimized
              />
            </div>
          );
          const key = `${image.url}-${index}`;

          return image.link ? (
            <Link
              key={key}
              href={image.link}
              className="shrink-0"
              aria-hidden={image.isDuplicate}
              tabIndex={image.isDuplicate ? -1 : undefined}
            >
              {tile}
            </Link>
          ) : (
            <div key={key} className="shrink-0" aria-hidden={image.isDuplicate}>
              {tile}
            </div>
          );
        })}
      </div>
    </div>
  );
}
