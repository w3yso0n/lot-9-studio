import Link from "next/link";
import { NewDropsManagerForm } from "@/components/admin/NewDropsManagerForm";
import { Button } from "@/components/ui/button";
import { getAdminNewDropProducts } from "@/lib/new-drops-repo";

export default async function AdminNewDropsPage() {
  const products = await getAdminNewDropProducts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            New Drops
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Selecciona productos, imagen y orden del carrusel principal.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">Volver al catálogo</Link>
        </Button>
      </div>

      <NewDropsManagerForm products={products} />
    </div>
  );
}
