import HomeView from "@/components/home/HomeView";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import type { HomeSection } from "@/lib/home-sections";
import { getHomeSettings } from "@/lib/home-settings-repo";
import { getHomeSections } from "@/lib/home-sections-repo";
import { getStorefrontHomeData } from "@/lib/products-repo";

export const revalidate = 60;

export default async function Home() {
  let products: Awaited<ReturnType<typeof getStorefrontHomeData>>["products"] = [];
  let newDrops: Awaited<ReturnType<typeof getStorefrontHomeData>>["newDrops"] = [];
  let homeSections: HomeSection[] = [];
  let homeSettings: HomeSettings = DEFAULT_HOME_SETTINGS;
  let dbError: string | null = null;
  try {
    const storefront = await getStorefrontHomeData();
    products = storefront.products;
    newDrops = storefront.newDrops;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Error de base de datos.";
  }
  try {
    homeSettings = await getHomeSettings();
    homeSections = await getHomeSections();
  } catch {
    homeSettings = DEFAULT_HOME_SETTINGS;
    homeSections = [];
  }
  return (
    <HomeView
      products={products}
      newDrops={newDrops}
      homeSettings={homeSettings}
      homeSections={homeSections}
      dbError={dbError}
    />
  );
}
