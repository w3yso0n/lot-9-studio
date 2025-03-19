import AllProducts from "@/components/products/AllProducts";

export default function ProductsPage() {
  return (
    <section className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Todos los Productos</h1>
      <AllProducts />
    </section>
  );
}
