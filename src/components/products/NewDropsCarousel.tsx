"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { newDrops } from "@/lib/data";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const NewDropsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % newDrops.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + newDrops.length) % newDrops.length);
  };

  return (
    <section className="relative container mx-auto py-8 sm:py-12 md:py-16 px-3 sm:px-4">
      {/* Encabezado */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-8 sm:mb-12"
      >
        <span className="text-sm font-medium tracking-widest text-primary mb-2 block">
          COLECCIÓN EXCLUSIVA
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          Nuevos Drops
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubre nuestras últimos diseños
        </p>
      </motion.div>

      {/* Carousel mejorado */}
      <div className="relative">
        {/* Contenedor de productos */}
        <div className="overflow-hidden rounded-xl">
          <motion.div
            className="flex transition-transform duration-500 ease-in-out"
            animate={{ x: `-${currentIndex * 100}%` }}
          >
            {newDrops.map((product, index) => (
              <div key={product.id} className="w-full flex-shrink-0 px-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: currentIndex === index ? 1 : 0.7,
                    scale: currentIndex === index ? 1.05 : 0.95,
                  }}
                  transition={{ duration: 0.3 }}
                  className="max-w-sm mx-auto"
                >
                  <ProductCard 
                    product={product} 
                    className="shadow-xl hover:shadow-2xl transition-all duration-300"
                  />
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Controles de navegación mejorados */}
        <div className="flex justify-center items-center mt-6 sm:mt-8 gap-4">
          <motion.button
            onClick={prevSlide}
            className="bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Indicadores mejorados */}
          <div className="flex gap-2">
            {newDrops.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-primary scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
            ))}
          </div>

          <motion.button
            onClick={nextSlide}
            className="bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>

        {/* Indicador de progreso mejorado */}
        <div className="mt-4 sm:mt-6 flex justify-center">
          <div className="h-1 bg-gray-200 rounded-full w-32 sm:w-48 md:w-64 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80"
              initial={{ width: "0%" }}
              animate={{ 
                width: `${((currentIndex + 1) / newDrops.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Información del slide actual */}
        <motion.div
          className="text-center mt-4"
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentIndex + 1} de {newDrops.length}
          </p>
        </motion.div>
      </div>

      {/* Botón para ver más */}
      <motion.div
        className="text-center mt-8 sm:mt-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <motion.button
          className="px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todos los nuevos drops
        </motion.button>
      </motion.div>
    </section>
  );
};

export default NewDropsCarousel;
