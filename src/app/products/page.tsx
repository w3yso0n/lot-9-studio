import AllProducts from "@/components/products/AllProducts";
import { getStorefrontHomeData } from "@/lib/products-repo";

export const revalidate = 60;

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getStorefrontHomeData>>["products"] = [];
  let newDrops: Awaited<ReturnType<typeof getStorefrontHomeData>>["newDrops"] = [];
  let dbError: string | null = null;
  try {
    ({ products, newDrops } = await getStorefrontHomeData());
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Error de base de datos.";
  }
  return (
    <div className="min-h-screen">
      <AllProducts products={products} newDrops={newDrops} dbError={dbError} />
    </div>
  );
}
