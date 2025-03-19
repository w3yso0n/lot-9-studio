import NewDropsCarousel from "@/components/products/NewDropsCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { products } from "@/lib/data";

const AllProducts = () => {
  return (
    <section className="container mx-auto py-10">
      {/* Sección de Nuevos Drops */}
      <NewDropsCarousel />

      {/* Sección de Productos */}
      <h2 className="text-3xl font-bold text-center mt-12 mb-8">Nuestros Productos</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default AllProducts;