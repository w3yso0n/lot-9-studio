import AllProducts from "@/components/products/AllProducts";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import { getHomeSettings } from "@/lib/home-settings-repo";
import { getStorefrontHomeData } from "@/lib/products-repo";

export const revalidate = 60;

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getStorefrontHomeData>>["products"] = [];
  let newDrops: Awaited<ReturnType<typeof getStorefrontHomeData>>["newDrops"] = [];
  let homeSettings: HomeSettings = DEFAULT_HOME_SETTINGS;
  let dbError: string | null = null;
  try {
    ({ products, newDrops } = await getStorefrontHomeData());
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Error de base de datos.";
  }
  try {
    homeSettings = await getHomeSettings();
  } catch {
    homeSettings = DEFAULT_HOME_SETTINGS;
  }
  return (
    <div className="min-h-screen">
      <AllProducts
        products={products}
        newDrops={newDrops}
        homeSettings={homeSettings}
        dbError={dbError}
      />
    </div>
  );
}
