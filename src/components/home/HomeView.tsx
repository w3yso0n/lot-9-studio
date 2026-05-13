"use client";

import HeroBanner from "@/components/banners/HeroBanner";
import AllProducts from "@/components/products/AllProducts";
import type { CatalogProduct } from "@/lib/catalog-product";
import { motion } from "framer-motion";

type Props = {
  products: CatalogProduct[];
  newDrops: CatalogProduct[];
  dbError?: string | null;
};

export default function HomeView({ products, newDrops, dbError }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-col items-center px-2 sm:px-4 md:px-8 lg:px-16">
        <HeroBanner />

        <motion.section
          className="mt-6 sm:mt-8 md:mt-12 w-full max-w-6xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <AllProducts products={products} newDrops={newDrops} dbError={dbError} />
        </motion.section>
      </main>
    </div>
  );
}
