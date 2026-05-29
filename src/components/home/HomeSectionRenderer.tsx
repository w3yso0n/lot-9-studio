"use client";

import HeroBanner from "@/components/banners/HeroBanner";
import { HomeImageCarousel } from "@/components/home/HomeImageCarousel";
import NewDropsCarousel from "@/components/products/NewDropsCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import type { CatalogProduct } from "@/lib/catalog-product";
import type { HomeSection } from "@/lib/home-sections";
import type { HomeSettings } from "@/lib/home-settings";
import Image from "next/image";
import Link from "next/link";

type Props = {
  sections: HomeSection[];
  products: CatalogProduct[];
  newDrops: CatalogProduct[];
  homeSettings: HomeSettings;
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function carouselSpeedValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(90, Math.max(18, value));
  }
  if (value === "slow" || value === "lento") return 55;
  if (value === "fast" || value === "rapido" || value === "rápido") return 24;
  return 22;
}

function imagesValue(value: unknown): Array<{ url: string; alt?: string; link?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { url: string; alt?: string; link?: string } =>
      typeof item === "object" &&
      item != null &&
      typeof (item as { url?: unknown }).url === "string"
  );
}

function sectionHeroSettings(
  section: HomeSection,
  fallback: HomeSettings
): HomeSettings {
  const crop = section.content.crop as Record<string, unknown> | undefined;
  return {
    ...fallback,
    heroTitle: stringValue(section.content.title) || section.title || fallback.heroTitle,
    heroSubtitle:
      stringValue(section.content.subtitle) || section.subtitle || fallback.heroSubtitle,
    heroButtonText:
      stringValue(section.content.buttonText) || fallback.heroButtonText,
    heroButtonHref:
      stringValue(section.content.buttonHref) || fallback.heroButtonHref,
    heroImageUrl: stringValue(section.content.imageUrl) || fallback.heroImageUrl,
    heroCropX: numberValue(crop?.x, fallback.heroCropX),
    heroCropY: numberValue(crop?.y, fallback.heroCropY),
    heroCropZoom: numberValue(crop?.zoom, fallback.heroCropZoom),
  };
}

export function HomeSectionRenderer({
  sections,
  products,
  newDrops,
  homeSettings,
}: Props) {
  return (
    <>
      {sections.map((section) => {
        if (section.type === "hero") {
          return (
            <HeroBanner
              key={section.id}
              settings={sectionHeroSettings(section, homeSettings)}
            />
          );
        }

        if (section.type === "new_drops") {
          return (
            <div key={section.id} className="mx-auto w-full max-w-6xl px-3 sm:px-6">
              <NewDropsCarousel newDrops={newDrops} />
            </div>
          );
        }

        if (section.type === "catalog") {
          const limit = Math.max(1, Math.floor(numberValue(section.content.limit, 12)));
          const showMore = booleanValue(section.content.showMore, true);
          return (
            <section key={section.id} id="catalogo" className="mx-auto w-full max-w-6xl px-3 py-8 scroll-mt-24 sm:px-6">
              {section.title ? (
                <h2 className="mb-5 text-2xl font-semibold">{section.title}</h2>
              ) : null}
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.slice(0, limit).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {showMore ? (
                <div className="mt-8 text-center">
                  <Link
                    href="/products#catalogo"
                    className="inline-flex border border-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white"
                  >
                    Ver más
                  </Link>
                </div>
              ) : null}
            </section>
          );
        }

        if (section.type === "video") {
          const url = stringValue(section.content.url);
          if (!url) return null;
          const layout = stringValue(section.content.layout) || "stacked";
          const textContent = stringValue(section.content.textContent);

          if (layout === "stacked") {
            return (
              <section key={section.id} className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6">
                {section.title ? (
                  <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>
                ) : null}
                <div className="aspect-video overflow-hidden bg-black">
                  <video
                    src={url}
                    autoPlay
                    muted
                    loop
                    className="h-full w-full object-cover"
                  />
                </div>
              </section>
            );
          }

          const isLeftLayout = layout === "side-left";
          return (
            <section key={section.id} className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6">
              <div className={`grid gap-8 items-center ${isLeftLayout ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                {isLeftLayout ? (
                  <>
                    <div className="aspect-video overflow-hidden bg-black">
                      <video
                        src={url}
                        autoPlay
                        muted
                        loop
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      {section.title && (
                        <h2 className="text-2xl font-semibold leading-tight">
                          {section.title}
                        </h2>
                      )}
                      {section.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {section.subtitle}
                        </p>
                      )}
                      {textContent ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {textContent}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col justify-center space-y-4">
                      {section.title && (
                        <h2 className="text-2xl font-semibold leading-tight">
                          {section.title}
                        </h2>
                      )}
                      {section.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {section.subtitle}
                        </p>
                      )}
                      {textContent ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {textContent}
                        </div>
                      ) : null}
                    </div>
                    <div className="aspect-video overflow-hidden bg-black">
                      <video
                        src={url}
                        autoPlay
                        muted
                        loop
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        }

        if (section.type === "banner") {
          const url = stringValue(section.content.imageUrl);
          if (!url) return null;
          const link = stringValue(section.content.link);
          const image = (
            <div className="relative aspect-[21/9] overflow-hidden bg-neutral-100">
              <Image src={url} alt={section.title || ""} fill className="object-cover" unoptimized />
              {section.title || section.subtitle ? (
                <div className="absolute inset-x-6 bottom-6 text-white drop-shadow">
                  {section.title ? <h2 className="text-3xl font-semibold">{section.title}</h2> : null}
                  {section.subtitle ? <p className="mt-1 text-sm">{section.subtitle}</p> : null}
                </div>
              ) : null}
            </div>
          );
          return (
            <section key={section.id} className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6">
              {link ? <Link href={link}>{image}</Link> : image}
            </section>
          );
        }

        if (section.type === "carousel") {
          const images = imagesValue(section.content.images);
          if (images.length === 0) return null;
          const speed = carouselSpeedValue(section.content.speed);
          const direction = stringValue(section.content.direction) === "right" ? "right" : "left";

          return (
            <section key={section.id} className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6">
              {section.title ? (
                <h2 className="mb-5 text-2xl font-semibold">{section.title}</h2>
              ) : null}
              <HomeImageCarousel
                images={images}
                title={section.title}
                speed={speed}
                direction={direction}
              />
            </section>
          );
        }

        if (section.type === "text") {
          return (
            <section key={section.id} className="mx-auto w-full max-w-4xl px-3 py-8 text-center sm:px-6">
              {section.title ? (
                <h2 className="text-2xl font-semibold">{section.title}</h2>
              ) : null}
              {section.subtitle ? (
                <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p>
              ) : null}
              {stringValue(section.content.text) ? (
                <p className="mt-4 text-sm leading-6">{stringValue(section.content.text)}</p>
              ) : null}
            </section>
          );
        }

        return null;
      })}
    </>
  );
}
