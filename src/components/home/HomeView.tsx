"use client";

import HeroBanner from "@/components/banners/HeroBanner";
import AllProducts from "@/components/products/AllProducts";
import type { CatalogProduct } from "@/lib/catalog-product";
import type { HomeSettings } from "@/lib/home-settings";

type Props = {
  products: CatalogProduct[];
  newDrops: CatalogProduct[];
  homeSettings: HomeSettings;
  dbError?: string | null;
};

export default function HomeView({
  products,
  newDrops,
  homeSettings,
  dbError,
}: Props) {
  return (
    <div className="min-h-screen">
      <main className="flex flex-col items-center">
        {homeSettings.isHeroEnabled ? (
          <HeroBanner settings={homeSettings} />
        ) : null}

        <section className="w-full max-w-6xl">
          <AllProducts
            products={products}
            newDrops={newDrops}
            homeSettings={homeSettings}
            dbError={dbError}
          />
        </section>
      </main>
    </div>
  );
}
