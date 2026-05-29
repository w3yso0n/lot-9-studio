import type { HomeSection } from "@/lib/home-sections";
import type { HomeSettings } from "@/lib/home-settings";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sectionHeroSettings(
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
