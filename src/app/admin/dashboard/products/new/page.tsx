import { NewProductPageClient } from "@/components/admin/NewProductPageClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-none">
      <header className="mb-6 space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/admin/dashboard">
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Nuevo producto</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Las fotos se suben a Cloudinary (no al servidor). En el celular
            solo verás el formulario; la vista previa aparece en pantallas
            grandes.
          </p>
        </div>
      </header>
      <NewProductPageClient />
    </div>
  );
}
