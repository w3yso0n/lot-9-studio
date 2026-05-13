"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Ha ocurrido un error al cargar esta página. Puedes intentar de nuevo o volver al inicio. Si estabas en el panel
          de administración, comprueba tu conexión y que la sesión no haya caducado.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Intentar de nuevo
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && error.digest ? (
        <p className="text-muted-foreground font-mono text-xs break-all">Digest: {error.digest}</p>
      ) : null}
    </div>
  );
}
