import NewDropsCarousel from "@/components/products/NewDropsCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CatalogProduct } from "@/lib/catalog-product";
import type { HomeSettings } from "@/lib/home-settings";

type Props = {
  products: CatalogProduct[];
  newDrops: CatalogProduct[];
  homeSettings: HomeSettings;
  dbError?: string | null;
};

const AllProducts = ({ products, newDrops, homeSettings, dbError }: Props) => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-10">
      {dbError ? (
        <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      ) : null}

      <NewDropsCarousel newDrops={newDrops} />

      {homeSettings.isVideoEnabled && homeSettings.featuredVideoUrl ? (
        <div
          id="destacados"
          className="my-12 relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-lg bg-black scroll-mt-24"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen"
            className="w-full h-full object-cover"
          >
            <source src={homeSettings.featuredVideoUrl} />
            Tu navegador no soporta la etiqueta de video.
          </video>
        </div>
      ) : null}

      <div
        id="catalogo"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 scroll-mt-24"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="hover:scale-[1.02] transition-transform duration-200"
          />
        ))}
      </div>
    </section>
  );
};

export default AllProducts;
