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
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-col items-center px-2 sm:px-4 md:px-8 lg:px-16">
        {homeSettings.isHeroEnabled ? (
          <HeroBanner settings={homeSettings} />
        ) : null}

        <section className="mt-6 sm:mt-8 md:mt-12 w-full max-w-6xl">
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
