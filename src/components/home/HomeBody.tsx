import { HomeSectionRenderer } from "@/components/home/HomeSectionRenderer";
import AllProducts from "@/components/products/AllProducts";
import type { CatalogProduct } from "@/lib/catalog-product";
import type { HomeSection } from "@/lib/home-sections";
import type { HomeSettings } from "@/lib/home-settings";
import { getStorefrontHomeData } from "@/lib/products-repo";

type Props = {
  homeSettings: HomeSettings;
  homeSections?: HomeSection[];
  usesHomeBuilder?: boolean;
};

export async function HomeBody({
  homeSettings,
  homeSections = [],
  usesHomeBuilder = false,
}: Props) {
  let products: CatalogProduct[] = [];
  let newDrops: CatalogProduct[] = [];
  let dbError: string | null = null;

  try {
    const storefront = await getStorefrontHomeData();
    products = storefront.products;
    newDrops = storefront.newDrops;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Error de base de datos.";
  }

  if (usesHomeBuilder || homeSections.length > 0) {
    const bodySections = homeSections.filter((section) => section.type !== "hero");
    if (bodySections.length === 0) return null;

    return (
      <main>
        {bodySections.map((section) => (
          <HomeSectionRenderer
            key={section.id}
            sections={[section]}
            products={products}
            newDrops={newDrops}
            homeSettings={homeSettings}
          />
        ))}
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center">
      <section className="w-full max-w-6xl">
        <AllProducts
          products={products}
          newDrops={newDrops}
          homeSettings={homeSettings}
          dbError={dbError}
        />
      </section>
    </main>
  );
}
