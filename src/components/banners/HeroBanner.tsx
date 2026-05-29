import type { HomeSettings } from "@/lib/home-settings";
import { getResponsiveCloudinaryImage } from "@/lib/product-image-url";
import { cloudinaryImageAttributes } from "@/lib/product-upload-paths";

type Props = {
  settings: HomeSettings;
};

const FALLBACK_TITLE_LINES = ["NO TODOS", "LO ENTENDERÁN"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const HeroBanner = ({ settings }: Props) => {
  const titleLines = settings.heroTitle
    .replace(/\\n/g, "\n")
    .replace(/\bENTENDERAN\b/gi, "ENTENDERÁN")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const buttonHref =
    !settings.heroButtonHref || settings.heroButtonHref === "#catalogo"
      ? "/products#catalogo"
      : settings.heroButtonHref;
  const isExternal = /^https?:\/\//i.test(buttonHref);
  const cropX = clamp(Number(settings.heroCropX) || 50, 0, 100);
  const cropY = clamp(Number(settings.heroCropY) || 50, 0, 100);
  const cropZoom = clamp(Number(settings.heroCropZoom) || 1, 1, 3);
  const heroSrc = settings.heroImageUrl?.trim() || "/images/background.png";
  const { src: heroDisplaySrc, srcSet, sizes } = getResponsiveCloudinaryImage(
    heroSrc,
    "hero"
  );
  const cloudinaryAttrs = cloudinaryImageAttributes(heroSrc);

  return (
    <section className="relative flex h-[50vh] min-h-[360px] max-h-[620px] w-full items-center justify-center overflow-hidden bg-muted sm:h-[52vh] md:h-[56vh] lg:h-[60vh]">
      {/* img nativo: pinta antes que next/image + menos trabajo en hidratación */}
      <img
        src={heroDisplaySrc}
        srcSet={srcSet}
        sizes={sizes ?? "100vw"}
        alt="Moda para hombres"
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        width={1920}
        height={1200}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        {...cloudinaryAttrs}
        style={{
          objectPosition: `${cropX}% ${cropY}%`,
          transform: `scale(${cropZoom})`,
          transformOrigin: `${cropX}% ${cropY}%`,
        }}
      />

      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/15 via-black/35 to-black/60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white sm:px-6">
        <h1 className="text-3xl font-bold leading-[0.95] drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
          {(titleLines.length > 0 ? titleLines : FALLBACK_TITLE_LINES).map(
            (line, index) => (
              <span
                key={`${line}-${index}`}
                className="hero-fade-up block"
                style={{ animationDelay: `${0.45 + index * 0.08}s` }}
              >
                {line}
              </span>
            )
          )}
        </h1>

        <p
          className="hero-fade-up mt-3 text-xs tracking-[0.28em] drop-shadow-md sm:mt-4 sm:text-sm md:text-base font-[family-name:var(--font-poppins)]"
          style={{ animationDelay: "0.85s" }}
        >
          {settings.heroSubtitle || "LOT9_STUDIO_GUADALAJARA"}
        </p>

        <div className="hero-fade-up mt-5 sm:mt-6" style={{ animationDelay: "1s" }}>
          <a
            href={buttonHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="inline-flex border border-white/30 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-white/85 sm:px-6 sm:py-2.5"
          >
            {settings.heroButtonText || "Descubre la colección"}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
