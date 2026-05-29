"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent } from "react";

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
  const loopWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const dragRef = useRef({
    active: false,
    pointerId: 0,
    startX: 0,
    startOffset: 0,
  });

  function applyOffset() {
    const track = trackRef.current;
    const loopWidth = loopWidthRef.current;
    if (!track || loopWidth <= 0) return;

    const normalized = ((offsetRef.current % loopWidth) + loopWidth) % loopWidth;
    offsetRef.current = normalized;
    const signedOffset = direction === "right" ? normalized - loopWidth : -normalized;
    track.style.transform = `translate3d(${signedOffset}px, 0, 0)`;
  }

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
      loopWidthRef.current = loopWidth;
      if (loopWidth > 0) {
        const delta = time - lastTime;
        if (!dragRef.current.active) {
          offset = (offset + (delta / duration) * loopWidth) % loopWidth;
          offsetRef.current = offset;
          applyOffset();
        } else {
          offset = offsetRef.current;
        }
      }

      lastTime = time;
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frame);
  }, [direction, images.length, speed]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;

    loopWidthRef.current = track.scrollWidth / 2;
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const loopWidth = loopWidthRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId || loopWidth <= 0) return;

    const delta = event.clientX - drag.startX;
    offsetRef.current =
      direction === "right" ? drag.startOffset + delta : drag.startOffset - delta;
    applyOffset();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released if the pointer was cancelled.
    }
  }

  const loopImages = [
    ...images.map((image) => ({ ...image, isDuplicate: false })),
    ...images.map((image) => ({ ...image, isDuplicate: true })),
  ];

  return (
    <div
      className="home-marquee w-full cursor-grab overflow-hidden active:cursor-grabbing"
      data-home-image-carousel
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
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
