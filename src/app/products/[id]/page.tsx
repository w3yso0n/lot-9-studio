import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { getProductById } from "@/lib/products-repo";
import { notFound } from "next/navigation";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const product = await getProductById(id);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
