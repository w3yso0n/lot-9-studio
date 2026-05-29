import type { HomeSection } from "@/lib/home-sections";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import { getProductImageDisplayUrl } from "@/lib/product-image-url";

function stringContent(content: Record<string, unknown>, key: string): string {
  const value = content[key];
  return typeof value === "string" ? value.trim() : "";
}

/** URL de la imagen LCP más probable en la home (hero). */
export function getHomeLcpImageUrl(
  homeSettings: HomeSettings,
  homeSections: HomeSection[],
  usesHomeBuilder: boolean
): string | null {
  if (usesHomeBuilder || homeSections.length > 0) {
    const heroSection = homeSections.find((section) => section.type === "hero");
    if (heroSection) {
      const fromSection = stringContent(heroSection.content, "imageUrl");
      if (fromSection) return getProductImageDisplayUrl(fromSection, "hero");
    }
    return null;
  }

  if (!homeSettings.isHeroEnabled) return null;

  const url = homeSettings.heroImageUrl?.trim();
  const raw = url || DEFAULT_HOME_SETTINGS.heroImageUrl;
  return getProductImageDisplayUrl(raw, "hero");
}

export function getCloudinaryOrigin(): string | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}`;
}
