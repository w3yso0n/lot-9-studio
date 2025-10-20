"use client";

import HeroBanner from "@/components/banners/HeroBanner";
import AllProducts from "@/components/products/AllProducts";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Contenido principal */}
      <main className="flex flex-col items-center px-2 sm:px-4 md:px-8 lg:px-16">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Sección de productos con animación de entrada */}
        <motion.section 
          className="mt-6 sm:mt-8 md:mt-12 w-full max-w-6xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <AllProducts />
        </motion.section>
      </main>
    </div>
  );
}
