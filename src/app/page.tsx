import { HomeBody } from "@/components/home/HomeBody";
import { HomeBodySkeleton } from "@/components/home/HomeBodySkeleton";
import { HomeHero } from "@/components/home/HomeHero";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import type { HomeSection } from "@/lib/home-sections";
import { getHomeLcpPreloads } from "@/lib/home-lcp";
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

  const lcpPreloads = getHomeLcpPreloads(homeSettings, homeSections, usesHomeBuilder);

  return (
    <div className="min-h-screen">
      {lcpPreloads.map((preload) => (
        <link
          key={`${preload.href}-${preload.media ?? "all"}`}
          rel="preload"
          as="image"
          href={preload.href}
          media={preload.media}
          fetchPriority="high"
        />
      ))}
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
