"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

function encodeWebPath(p: string): string {
  const t = p.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const parts = t.split("/").filter(Boolean);
  if (parts.length === 0) return t;
  return "/" + parts.map(encodeURIComponent).join("/");
}

export type AdminStorefrontPreviewProps = {
  name: string;
  price: number;
  images: string[];
  variantLabel: string;
  description: string;
  sizes: string[];
  stockBySize: Record<string, number>;
  isPublished: boolean;
  isNewDrop: boolean;
};

export function AdminStorefrontPreview({
  name,
  price,
  images,
  variantLabel,
  description,
  sizes,
  stockBySize,
  isPublished,
  isNewDrop,
}: AdminStorefrontPreviewProps) {
  const main = images[0];
  const displayName = name.trim() || "Nombre del producto";
  const hasStock = sizes.some((size) => (stockBySize[size] ?? 0) > 0);

  return (
    <aside className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none space-y-5 lg:sticky lg:top-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Vista previa
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Aproximación a tarjeta y ficha según lo que configuras.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isPublished ? (
          <Badge variant="outline" className="border-amber-500/50 text-amber-800 dark:text-amber-300">
            Borrador
          </Badge>
        ) : (
          <Badge variant="secondary">Publicado</Badge>
        )}
        {isNewDrop ? <Badge>Nuevo drop</Badge> : null}
      </div>

      {/* Tarjeta tipo grid de tienda */}
      <Card className="overflow-hidden shadow-lg rounded-xl bg-card border-border/80">
        <CardContent className="p-0 flex flex-col">
          <div className="relative w-full aspect-[3/4] max-h-[280px] bg-muted">
            {main ? (
              <Image
                src={encodeWebPath(main)}
                alt=""
                fill
                className="object-cover"
                sizes="400px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
            {!hasStock && main ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Image
                  src="/images/sold_out.png"
                  alt="Agotado"
                  width={140}
                  height={140}
                  className="opacity-90"
                />
              </div>
            ) : null}
          </div>
          <div className="p-4 space-y-2 text-center border-t bg-background/80">
            <h3 className="text-base font-bold leading-snug line-clamp-2 text-foreground">{displayName}</h3>
            <p className="text-lg font-bold tabular-nums">${price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Mini ficha tipo página de producto */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="relative aspect-square max-h-[200px] w-full max-w-[200px] mx-auto bg-muted rounded-lg overflow-hidden m-4 mb-0">
          {main ? (
            <Image
              src={encodeWebPath(main)}
              alt=""
              fill
              className="object-cover rounded-lg"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
              Añade una imagen
            </div>
          )}
        </div>
        <CardContent className="p-4 pt-3 space-y-3">
          <div>
            <h4 className="text-lg font-bold leading-tight">{displayName}</h4>
            {variantLabel ? (
              <p className="text-sm text-muted-foreground mt-0.5">{variantLabel}</p>
            ) : null}
            <p className="text-base font-semibold tabular-nums mt-2">${price.toFixed(2)}</p>
          </div>
          {sizes.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Tallas</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const q = stockBySize[size] ?? 0;
                  const out = q === 0;
                  return (
                    <span
                      key={size}
                      className={cn(
                        "px-3 py-1.5 rounded-md border text-sm font-medium",
                        out
                          ? "border-muted text-muted-foreground line-through opacity-70"
                          : "border-border bg-muted/40"
                      )}
                    >
                      {size}
                      <span className="text-xs font-normal text-muted-foreground ml-1">({q})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6">
              {description.trim() || "—"}
            </p>
          </div>
          <Button type="button" variant="secondary" className="w-full" disabled>
            Añadir al carrito (vista previa)
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
