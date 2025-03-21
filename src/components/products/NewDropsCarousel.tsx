"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { newDrops } from "@/lib/data";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const NewDropsCarousel = () => {
  return (
    <section className="container mx-auto py-10 ">
      <h2 className="text-5xl font-bold text-center mb-6 font-nyght-serif"> Nuevos Drops </h2>

      <Swiper
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        modules={[Autoplay, Pagination]}
        className="w-full"
      >
        {newDrops.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard key={product.id} product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NewDropsCarousel;
