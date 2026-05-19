"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProductDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-md">
      <h1 className="text-xl font-bold mb-2">No se pudo mostrar este producto</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Suele pasar en celulares con muchas fotos o poca memoria. Prueba recargar
        o abrir desde otra red.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button type="button" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Ver catálogo</Link>
        </Button>
      </div>
    </div>
  );
}
