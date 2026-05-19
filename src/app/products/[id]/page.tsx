import { ProductDetailSkeleton } from "@/components/products/ProductDetailSkeleton";
import { slimProductForDetailPage } from "@/lib/product-detail-payload";
import { getProductById } from "@/lib/products-repo";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ProductDetailClient = dynamic(
  () =>
    import("@/components/products/ProductDetailClient").then((m) => ({
      default: m.ProductDetailClient,
    })),
  { loading: () => <ProductDetailSkeleton /> }
);

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <ProductDetailClient product={slimProductForDetailPage(product)} />
  );
}
