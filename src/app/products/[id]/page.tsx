import { Button } from "@/components/ui/button";
import { products } from "@/lib/data";
import Image from "next/image";
import { notFound } from "next/navigation";


export default function ProductPage({ params }: any) {
  const product = products.find((p) => p.id === parseInt(params.id, 10));

  if (!product) return notFound(); // Si el producto no existe, devuelve un 404

  return (
    <section className="container mx-auto py-12 flex flex-col md:flex-row items-center gap-10">
      {/* Imagen del producto */}
      <div className="relative w-full max-w-md h-[500px]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="rounded-lg object-cover"
        />
      </div>

      {/* Detalles del producto */}
      <div className="max-w-lg">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-gray-600 text-lg">${product.price.toFixed(2)}</p>

        <p className="mt-4 text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin et nunc nec velit suscipit sollicitudin.
        </p>

        {/* Botón de añadir al carrito */}
        <div className="mt-6">
          <Button className="w-full md:w-auto">Añadir al carrito</Button>
        </div>
      </div>
    </section>
  );
}