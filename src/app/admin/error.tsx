"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Error en administración</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          No se pudo completar la acción o cargar esta sección. Si acabas de guardar un producto o subir una imagen, revisa
          la conexión a la base de datos y que Cloudinary esté configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET).
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Intentar de nuevo
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/dashboard">Volver al panel</Link>
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/login">Iniciar sesión</Link>
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && error.digest ? (
        <p className="text-muted-foreground font-mono text-xs break-all">Digest: {error.digest}</p>
      ) : null}
    </div>
  );
}
