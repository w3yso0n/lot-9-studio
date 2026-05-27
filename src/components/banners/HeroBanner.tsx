"use client";

import { poppins } from "@/app/fonts";
import type { HomeSettings } from "@/lib/home-settings";
import { motion } from "framer-motion";
import Image from "next/image";

type Props = {
  settings: HomeSettings;
};

const FALLBACK_TITLE_LINES = ["NO", "TODOS", "LO", "ENTENDERAN"];

const HeroBanner = ({ settings }: Props) => {
  const titleLines = settings.heroTitle
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const buttonHref = settings.heroButtonHref || "#catalogo";
  const isExternal = /^https?:\/\//i.test(buttonHref);

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <Image
          src={settings.heroImageUrl || "/images/background.png"}
          alt="Moda para hombres"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold drop-shadow-lg leading-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
        >
          {(titleLines.length > 0 ? titleLines : FALLBACK_TITLE_LINES).map(
            (line, index) => (
              <motion.span
                key={`${line}-${index}`}
                className="block"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 + index * 0.2 }}
              >
                {line}
              </motion.span>
            )
          )}
        </motion.h1>

        <motion.p
          className={`mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl drop-shadow-md ${poppins.className} tracking-wider`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          {settings.heroSubtitle || "LOT9_STUDIO_GUADALAJARA"}
        </motion.p>

        <motion.div
          className="mt-6 sm:mt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
        >
          <motion.a
            href={buttonHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="inline-flex px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            {settings.heroButtonText || "Descubre la colección"}
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        className="hidden sm:block absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="hidden md:block absolute top-40 right-20 w-1 h-1 bg-white/40 rounded-full"
        animate={{
          y: [0, -15, 0],
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="hidden lg:block absolute bottom-32 left-20 w-1.5 h-1.5 bg-white/20 rounded-full"
        animate={{
          y: [0, -25, 0],
          opacity: [0.2, 0.7, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </section>
  );
};

export default HeroBanner;
