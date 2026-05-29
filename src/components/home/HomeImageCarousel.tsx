"use client";

import { getProductImageDisplayUrl } from "@/lib/product-image-url";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

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
  const src = getProductImageDisplayUrl(image.url, "carousel");

  const media = (
    <img
      src={src}
      alt={image.isDuplicate ? "" : label}
      loading={eagerLoad ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      fetchPriority={eagerLoad ? "auto" : "low"}
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      aria-hidden={image.isDuplicate || undefined}
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

export function HomeImageCarousel({ images, title, speed, direction }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: 0,
    startX: 0,
    startOffset: 0,
  });

  const imageSignature = useMemo(
    () =>
      images
        .map((image) => `${image.url}|${image.link ?? ""}|${image.alt ?? ""}`)
        .join("~"),
    [images]
  );

  const loopImages = useMemo<LoopImage[]>(
    () => [
      ...images.map((image) => ({ ...image, isDuplicate: false as const })),
      ...images.map((image) => ({ ...image, isDuplicate: true as const })),
    ],
    [images]
  );

  const measureLoopWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const loopWidth = track.scrollWidth / 2;
    loopWidthRef.current = loopWidth;
    return loopWidth;
  }, []);

  const applyOffset = useCallback(() => {
    const track = trackRef.current;
    const loopWidth = loopWidthRef.current;
    if (!track || loopWidth <= 0) return;

    const normalized = ((offsetRef.current % loopWidth) + loopWidth) % loopWidth;
    offsetRef.current = normalized;
    const signedOffset =
      direction === "right" ? normalized - loopWidth : -normalized;
    track.style.transform = `translate3d(${signedOffset}px, 0, 0)`;
  }, [direction]);

  const remeasure = useCallback(() => {
    measureLoopWidth();
    applyOffset();
  }, [applyOffset, measureLoopWidth]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    remeasure();
  }, [imageSignature, direction, remeasure]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0 || reducedMotion) return;

    let frame = 0;
    let lastTime = performance.now();
    let offset = offsetRef.current;
    const durationMs = clampSpeed(speed) * 1000;

    const onVisibility = () => {
      pausedRef.current = document.visibilityState !== "visible";
      lastTime = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const animate = (time: number) => {
      const loopWidth = loopWidthRef.current;
      if (loopWidth > 0) {
        const delta = Math.min(time - lastTime, 48);
        if (!dragRef.current.active && !pausedRef.current) {
          offset = (offset + (delta / durationMs) * loopWidth) % loopWidth;
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

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    applyOffset,
    direction,
    imageSignature,
    images.length,
    reducedMotion,
    speed,
  ]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reducedMotion) return;

    const observer = new ResizeObserver(() => {
      remeasure();
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [imageSignature, reducedMotion, remeasure]);

  function setPaused(next: boolean) {
    pausedRef.current = next;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const track = trackRef.current;
    if (!track) return;

    measureLoopWidth();
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current,
    };
    setPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const loopWidth = loopWidthRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId || loopWidth <= 0) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    offsetRef.current =
      direction === "right" ? drag.startOffset + delta : drag.startOffset - delta;
    applyOffset();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    setPaused(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released if the pointer was cancelled.
    }
  }

  function onClickCapture(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  }

  if (images.length === 0) return null;

  const regionLabel = title.trim() || "Carrusel de imágenes";

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

  return (
    <div
      ref={containerRef}
      className="home-marquee w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
      data-home-image-carousel
      role="region"
      aria-label={regionLabel}
      aria-roledescription="carrusel"
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(event) => event.preventDefault()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!dragRef.current.active) setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform">
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
