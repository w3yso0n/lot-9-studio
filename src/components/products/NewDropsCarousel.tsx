import { ProductCard } from "@/components/products/ProductCard";
import { NewDropsCarouselShell } from "@/components/products/NewDropsCarouselShell";
import type { CatalogProduct } from "@/lib/catalog-product";

type Props = { newDrops: CatalogProduct[] };

export default function NewDropsCarousel({ newDrops }: Props) {
  if (newDrops.length === 0) return null;

  return (
    <NewDropsCarouselShell slideCount={newDrops.length}>
      {newDrops.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </NewDropsCarouselShell>
  );
}
