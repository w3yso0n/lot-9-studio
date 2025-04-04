import HeroBanner from "@/components/banners/HeroBanner";
import AllProducts from "@/components/products/AllProducts";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Contenido principal */}
      <main className="flex flex-col items-center px-4 sm:px-8 lg:px-16">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Sección de productos */}
        <section className="mt-12 w-full max-w-6xl">
          <AllProducts />
        </section>
      </main>
    </div>
  );
}
