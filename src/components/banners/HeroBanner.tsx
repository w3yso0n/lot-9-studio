"use client";

import { poppins } from "@/app/fonts";
import type { HomeSettings } from "@/lib/home-settings";
import { motion } from "framer-motion";
import Image from "next/image";

type Props = {
  settings: HomeSettings;
};

const FALLBACK_TITLE_LINES = ["NO TODOS", "LO ENTENDERÁN"];

const HeroBanner = ({ settings }: Props) => {
  const titleLines = settings.heroTitle
    .replace(/\\n/g, "\n")
    .replace(/\bENTENDERAN\b/gi, "ENTENDERÁN")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const buttonHref =
    !settings.heroButtonHref || settings.heroButtonHref === "#catalogo"
      ? "/products#catalogo"
      : settings.heroButtonHref;
  const isExternal = /^https?:\/\//i.test(buttonHref);

  return (
    <section className="relative flex h-[50vh] min-h-[360px] max-h-[620px] w-full items-center justify-center overflow-hidden bg-gray-100 sm:h-[52vh] md:h-[56vh] lg:h-[60vh] dark:bg-gray-900">
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
        className="absolute inset-0 z-0 bg-gradient-to-b from-black/15 via-black/35 to-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white sm:px-6">
        <motion.h1
          className="text-3xl font-bold leading-[0.95] drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl"
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
          className={`mt-3 text-xs tracking-[0.28em] drop-shadow-md sm:mt-4 sm:text-sm md:text-base ${poppins.className}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          {settings.heroSubtitle || "LOT9_STUDIO_GUADALAJARA"}
        </motion.p>

        <motion.div
          className="mt-5 sm:mt-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
        >
          <motion.a
            href={buttonHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="inline-flex border border-white/30 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-all duration-300 hover:bg-white/85 sm:px-6 sm:py-2.5"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            {settings.heroButtonText || "Descubre la colección"}
          </motion.a>
        </motion.div>
      </div>

    </section>
  );
};

export default HeroBanner;
