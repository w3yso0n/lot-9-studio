import AllProducts from "@/components/products/AllProducts";
import { getCatalogProducts, getNewDrops } from "@/lib/products-repo";

export const revalidate = 60;

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getCatalogProducts>> = [];
  let newDrops: Awaited<ReturnType<typeof getNewDrops>> = [];
  let dbError: string | null = null;
  try {
    [products, newDrops] = await Promise.all([getCatalogProducts(), getNewDrops()]);
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Error de base de datos.";
  }
  return (
    <div className="min-h-screen">
      <AllProducts products={products} newDrops={newDrops} dbError={dbError} />
    </div>
  );
}
