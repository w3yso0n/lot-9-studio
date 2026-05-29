"use client";

import { getResponsiveCloudinaryImage } from "@/lib/product-image-url";
import { cloudinaryImageAttributes } from "@/lib/product-upload-paths";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type CarouselImage = {
  url: string;
  alt?: string;
  link?: string;
};

type LoopImage = CarouselImage & {
  isDuplicate: boolean;
};

type Props = {
  images: CarouselImage[];
  title: string;
  speed: number;
  direction: "left" | "right";
};

const SLIDE_CLASS =
  "relative block aspect-[4/5] w-[76vw] max-w-[340px] shrink-0 overflow-hidden bg-muted bg-cover bg-center sm:w-[42vw] lg:w-[28vw] xl:w-[340px]";

function clampSpeed(value: number): number {
  return Math.max(14, Math.min(90, value));
}

function isInteractiveLink(link?: string): boolean {
  const href = link?.trim();
  return Boolean(href && href !== "#");
}

function CarouselSlide({
  image,
  title,
  className,
  eagerLoad,
}: {
  image: LoopImage;
  title: string;
  className?: string;
  eagerLoad?: boolean;
}) {
  const label = image.alt?.trim() || title || "Imagen del carrusel";
  const classNames = `${SLIDE_CLASS} ${className ?? ""}`.trim();
  const { src, srcSet, sizes } = getResponsiveCloudinaryImage(image.url, "carousel");

  const media = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={image.isDuplicate ? "" : label}
      loading={eagerLoad ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      fetchPriority={eagerLoad ? "auto" : "low"}
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      aria-hidden={image.isDuplicate || undefined}
      {...cloudinaryImageAttributes(image.url)}
    />
  );

  if (isInteractiveLink(image.link) && !image.isDuplicate) {
    return (
      <Link href={image.link!.trim()} className={classNames} aria-label={label}>
        {media}
      </Link>
    );
  }

  return (
    <div
      className={classNames}
      role={image.isDuplicate ? undefined : "img"}
      aria-label={image.isDuplicate ? undefined : label}
      aria-hidden={image.isDuplicate || undefined}
    >
      {media}
    </div>
  );
}

/** Carrusel infinito con CSS animation (sin rAF en el hilo principal). */
export function HomeImageCarousel({ images, title, speed, direction }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  const loopImages = useMemo<LoopImage[]>(
    () => [
      ...images.map((image) => ({ ...image, isDuplicate: false as const })),
      ...images.map((image) => ({ ...image, isDuplicate: true as const })),
    ],
    [images]
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.visibilityState !== "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (images.length === 0) return null;

  const regionLabel = title.trim() || "Carrusel de imágenes";
  const durationSec = clampSpeed(speed);

  if (reducedMotion) {
    return (
      <div
        className="home-marquee w-full overflow-x-auto overscroll-x-contain"
        role="region"
        aria-label={regionLabel}
      >
        <div className="flex w-max gap-4 snap-x snap-mandatory px-1 pb-1">
          {images.map((image, index) => (
            <CarouselSlide
              key={`${image.url}-${index}`}
              image={{ ...image, isDuplicate: false }}
              title={title}
              className="snap-center"
              eagerLoad={index < 2}
            />
          ))}
        </div>
      </div>
    );
  }

  const trackClass =
    direction === "right" ? "home-marquee-track home-marquee-track--right" : "home-marquee-track";

  const marqueeStyle = {
    "--marquee-duration": `${durationSec}s`,
  } as CSSProperties;

  return (
    <div
      className="home-marquee w-full overflow-hidden"
      data-home-image-carousel
      data-paused={paused ? "true" : undefined}
      role="region"
      aria-label={regionLabel}
      aria-roledescription="carrusel"
      style={marqueeStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className={`flex w-max gap-4 ${trackClass}`}>
        {loopImages.map((image, index) => (
          <CarouselSlide
            key={`${image.url}-${image.isDuplicate ? "dup" : "orig"}-${index}`}
            image={image}
            title={title}
            eagerLoad={!image.isDuplicate && index < 2}
          />
        ))}
      </div>
    </div>
  );
}
