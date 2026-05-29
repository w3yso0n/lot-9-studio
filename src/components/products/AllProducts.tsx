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
    <section className="container mx-auto px-3 py-8 sm:px-6 sm:py-10">
      {dbError ? (
        <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      ) : null}

      <NewDropsCarousel newDrops={newDrops} />

      <div
        id="catalogo"
        className="grid grid-cols-2 gap-x-3 gap-y-8 scroll-mt-24 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {homeSettings.isVideoEnabled && homeSettings.featuredVideoUrl ? (
        <section
          id="destacados"
          className="mt-12 grid items-center gap-6 scroll-mt-24 border-t pt-8 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,1.2fr)] lg:mt-14 lg:pt-10"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              LOTNINE
            </p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Mira la vibra. Compra la pieza.
            </h2>
          </div>

          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              disablePictureInPicture
              controlsList="nodownload nofullscreen"
              className="h-full w-full object-cover"
            >
              <source src={homeSettings.featuredVideoUrl} />
              Tu navegador no soporta la etiqueta de video.
            </video>
          </div>
        </section>
      ) : null}
    </section>
  );
};

export default AllProducts;
