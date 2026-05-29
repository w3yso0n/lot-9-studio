import type { HomeSection } from "@/lib/home-sections";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import {
  getCloudinaryUrlAtWidth,
  getResponsiveCloudinaryImage,
} from "@/lib/product-image-url";
import { isCloudinaryPanelUrl } from "@/lib/product-upload-paths";

function stringContent(content: Record<string, unknown>, key: string): string {
  const value = content[key];
  return typeof value === "string" ? value.trim() : "";
}

function resolveHeroRawUrl(
  homeSettings: HomeSettings,
  homeSections: HomeSection[],
  usesHomeBuilder: boolean
): string | null {
  if (usesHomeBuilder || homeSections.length > 0) {
    const heroSection = homeSections.find((section) => section.type === "hero");
    if (heroSection) {
      const fromSection = stringContent(heroSection.content, "imageUrl");
      if (fromSection) return fromSection;
    }
    return null;
  }

  if (!homeSettings.isHeroEnabled) return null;

  const url = homeSettings.heroImageUrl?.trim();
  return url || DEFAULT_HOME_SETTINGS.heroImageUrl;
}

/** URL de preload LCP (fallback desktop). */
export function getHomeLcpImageUrl(
  homeSettings: HomeSettings,
  homeSections: HomeSection[],
  usesHomeBuilder: boolean
): string | null {
  const raw = resolveHeroRawUrl(homeSettings, homeSections, usesHomeBuilder);
  if (!raw) return null;
  if (!isCloudinaryPanelUrl(raw)) return raw;
  return getCloudinaryUrlAtWidth(raw, "hero", 1080);
}

/** Preloads responsive para hero (móvil vs desktop). */
export function getHomeLcpPreloads(
  homeSettings: HomeSettings,
  homeSections: HomeSection[],
  usesHomeBuilder: boolean
): Array<{ href: string; media?: string }> {
  const raw = resolveHeroRawUrl(homeSettings, homeSections, usesHomeBuilder);
  if (!raw) return [];
  if (!isCloudinaryPanelUrl(raw)) {
    return [{ href: raw }];
  }

  return [
    {
      href: getCloudinaryUrlAtWidth(raw, "hero", 480),
      media: "(max-width: 640px)",
    },
    {
      href: getCloudinaryUrlAtWidth(raw, "hero", 1080),
      media: "(min-width: 641px)",
    },
  ];
}

export function getCloudinaryOrigin(): string | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}`;
}
