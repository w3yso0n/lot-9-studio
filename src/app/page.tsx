import { HomeBody } from "@/components/home/HomeBody";
import { HomeBodySkeleton } from "@/components/home/HomeBodySkeleton";
import { HomeHero } from "@/components/home/HomeHero";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import type { HomeSection } from "@/lib/home-sections";
import { getHomeLcpImageUrl } from "@/lib/home-lcp";
import { getHomeSettings } from "@/lib/home-settings-repo";
import { getHomeSections, isHomeBuilderConfigured } from "@/lib/home-sections-repo";
import { Suspense } from "react";

export const revalidate = 60;

export default async function Home() {
  let homeSections: HomeSection[] = [];
  let usesHomeBuilder = false;
  let homeSettings: HomeSettings = DEFAULT_HOME_SETTINGS;

  try {
    [homeSettings, homeSections, usesHomeBuilder] = await Promise.all([
      getHomeSettings(),
      getHomeSections(),
      isHomeBuilderConfigured(),
    ]);
  } catch {
    homeSettings = DEFAULT_HOME_SETTINGS;
    homeSections = [];
    usesHomeBuilder = false;
  }

  const lcpImageUrl = getHomeLcpImageUrl(homeSettings, homeSections, usesHomeBuilder);

  return (
    <div className="min-h-screen">
      {lcpImageUrl ? (
        <link rel="preload" as="image" href={lcpImageUrl} fetchPriority="high" />
      ) : null}
      <HomeHero
        homeSettings={homeSettings}
        homeSections={homeSections}
        usesHomeBuilder={usesHomeBuilder}
      />
      <Suspense fallback={<HomeBodySkeleton />}>
        <HomeBody
          homeSettings={homeSettings}
          homeSections={homeSections}
          usesHomeBuilder={usesHomeBuilder}
        />
      </Suspense>
    </div>
  );
}
