import HeroBanner from "@/components/banners/HeroBanner";
import type { HomeSection } from "@/lib/home-sections";
import { sectionHeroSettings } from "@/lib/home-section-helpers";
import type { HomeSettings } from "@/lib/home-settings";

type Props = {
  homeSettings: HomeSettings;
  homeSections?: HomeSection[];
  usesHomeBuilder?: boolean;
};

/** Hero above-the-fold: sin esperar al catálogo. */
export function HomeHero({
  homeSettings,
  homeSections = [],
  usesHomeBuilder = false,
}: Props) {
  if (usesHomeBuilder || homeSections.length > 0) {
    return (
      <>
        {homeSections
          .filter((section) => section.type === "hero")
          .map((section) => (
            <HeroBanner
              key={section.id}
              settings={sectionHeroSettings(section, homeSettings)}
            />
          ))}
      </>
    );
  }

  if (!homeSettings.isHeroEnabled) return null;

  return <HeroBanner settings={homeSettings} />;
}
