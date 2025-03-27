"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { newDrops } from "@/lib/data";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";

const NewDropsCarousel = () => {
  const swiperRef = useRef<SwiperRef>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Efecto de parar autoplay al hacer hover
  useEffect(() => {
    if (swiperRef.current) {
      if (isHovered) {
        swiperRef.current.swiper.autoplay.stop();
      } else {
        swiperRef.current.swiper.autoplay.start();
      }
    }
  }, [isHovered]);

  return (
    <section className="relative container mx-auto py-16 px-4">
      {/* Encabezado con efecto parallax */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="text-sm font-medium tracking-widest text-primary mb-2 block">
          COLECCIÓN EXCLUSIVA
        </span>
        <h2 className="text-5xl md:text-6xl font-bold mb-4 font-nyght-serif bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
          Nuevos Drops
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubre nuestras últimas incorporaciones diseñadas para destacar
        </p>
      </motion.div>

      {/* Carousel premium */}
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Swiper
          ref={swiperRef}
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={"auto"}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
            slideShadows: true,
          }}
          spaceBetween={30}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
          className="!pb-12"
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          breakpoints={{
            640: {
              coverflowEffect: {
                depth: 150,
                modifier: 1.5,
              }
            },
            1024: {
              coverflowEffect: {
                depth: 200,
                modifier: 2,
              }
            }
          }}
        >
          {newDrops.map((product, index) => (
            <SwiperSlide key={product.id} className="!w-[280px] sm:!w-[320px] md:!w-[360px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: activeIndex === index ? 1 : 0.7,
                  scale: activeIndex === index ? 1.05 : 0.95,
                  y: activeIndex === index ? 0 : 10
                }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <ProductCard 
                  product={product} 
                  className="shadow-xl hover:shadow-2xl transition-all duration-300"
                />
                {activeIndex === index && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-6 left-0 right-0 flex justify-center"
                  >
                  </motion.div>
                )}
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Controles de navegación personalizados */}
        <div className="hidden md:flex">
          <button className="swiper-button-prev absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur p-3 rounded-full shadow-lg border hover:bg-primary hover:text-white transition-all duration-300">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button className="swiper-button-next absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur p-3 rounded-full shadow-lg border hover:bg-primary hover:text-white transition-all duration-300">
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="mt-8 flex justify-center">
        <div className="h-1 bg-gray-200 rounded-full w-64 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ 
              width: `${((activeIndex + 1) / newDrops.length) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </section>
  );
};

export default NewDropsCarousel;