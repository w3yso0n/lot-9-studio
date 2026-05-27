import Link from "next/link";
import Image from "next/image";
import { getAdminProductList, type AdminProductListItem } from "@/lib/products-repo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";

function encodePublicImagePath(p: string): string {
  const t = p.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const parts = t.split("/").filter(Boolean);
  if (parts.length === 0) return t;
  return "/" + parts.map(encodeURIComponent).join("/");
}

export default async function AdminDashboardPage() {
  let rows: AdminProductListItem[] = [];
  let loadError: string | null = null;
  try {
    rows = await getAdminProductList();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "No se pudo conectar a la base de datos.";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Catálogo</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {loadError ? "—" : `${rows.length} ${rows.length === 1 ? "producto" : "productos"}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" size="lg" className="shrink-0 w-full sm:w-auto">
            <Link href="/admin/dashboard/home-settings">Configuración Home</Link>
          </Button>
          <Button asChild size="lg" className="shrink-0 w-full sm:w-auto">
            <Link href="/admin/dashboard/products/new">+ Nuevo producto</Link>
          </Button>
        </div>
      </div>

      {loadError ? (
        <p className="text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl p-4 bg-red-50 dark:bg-red-950/30">
          {loadError}
        </p>
      ) : rows.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay productos todavía. Crea el primero o importa datos en PostgreSQL.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0">
          {rows.map((p) => {
            const cover = p.images[0];
            return (
              <li key={p.id}>
                <Card className="overflow-hidden h-full flex flex-col p-0 gap-0 border-border/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="relative aspect-[4/3] w-full bg-muted shrink-0">
                    {cover ? (
                      <Image
                        src={encodePublicImagePath(cover)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Package className="size-10 opacity-50" aria-hidden />
                        <span className="text-xs">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="px-4 pt-4 pb-2 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {p.is_published ? (
                        <Badge variant="secondary">En tienda</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-800 dark:text-amber-300">
                          Borrador
                        </Badge>
                      )}
                      {p.new_drop_sort != null ? (
                        <Badge>Nuevo drop · #{p.new_drop_sort}</Badge>
                      ) : null}
                    </div>
                    <CardTitle className="text-base leading-snug line-clamp-2">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{p.color}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 flex-1">
                    <div className="flex items-center justify-start gap-3">
                      {p.oldPrice != null && p.oldPrice > 1 && p.oldPrice > p.price ? (
                        <span className="text-sm text-muted-foreground line-through">
                          ${p.oldPrice.toFixed(2)}
                        </span>
                      ) : null}
                      <p className="text-xl font-semibold tabular-nums">${p.price.toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 pb-4 pt-0 mt-auto border-t bg-muted/20">
                    <Button asChild className="w-full" variant="default">
                      <Link href={`/admin/dashboard/products/${p.id}`}>Editar producto</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
