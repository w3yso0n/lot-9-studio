"use client";

import { AdminPreviewImage } from "@/components/admin/AdminPreviewImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export type AdminPreviewColorVariant = {
  label: string;
  images: string[];
  stockBySize: Record<string, number>;
};

export type AdminStorefrontPreviewProps = {
  name: string;
  price: number;
  images: string[];
  variantLabel: string;
  description: string;
  sizes: string[];
  stockBySize: Record<string, number>;
  colorVariants?: AdminPreviewColorVariant[];
  isPublished: boolean;
  isNewDrop: boolean;
};

function aggregateStock(
  variants: AdminPreviewColorVariant[],
  sizes: string[],
  fallback: Record<string, number>
): Record<string, number> {
  if (variants.length === 0) return fallback;
  const out: Record<string, number> = {};
  for (const size of sizes) {
    out[size] = variants.reduce(
      (sum, v) => sum + (v.stockBySize[size] ?? 0),
      0
    );
  }
  return out;
}

export function AdminStorefrontPreview({
  name,
  price,
  images,
  variantLabel,
  description,
  sizes,
  stockBySize,
  colorVariants = [],
  isPublished,
  isNewDrop,
}: AdminStorefrontPreviewProps) {
  const displayName = name.trim() || "Nombre del producto";

  const options = useMemo(() => {
    const fromVariants = colorVariants
      .map((v, index) => ({
        id: `color-${index}`,
        label: v.label.trim() || `Color ${index + 1}`,
        images: v.images.filter(Boolean),
        stockBySize: v.stockBySize,
      }))
      .filter((v) => v.images.length > 0);

    if (fromVariants.length > 0) return fromVariants;

    const legacyImages = images.filter(Boolean);
    if (legacyImages.length === 0) return [];

    return [
      {
        id: "main",
        label: variantLabel.trim() || "Color principal",
        images: legacyImages,
        stockBySize,
      },
    ];
  }, [colorVariants, images, variantLabel, stockBySize]);

  const [colorIndex, setColorIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const safeColorIndex =
    options.length > 0 ? Math.min(colorIndex, options.length - 1) : 0;
  const active = options[safeColorIndex];
  const activeImages = active?.images ?? [];
  const safeImageIndex = Math.min(
    imageIndex,
    Math.max(0, activeImages.length - 1)
  );
  const mainDetail = activeImages[safeImageIndex] ?? activeImages[0] ?? "";
  const activeLabel = active?.label ?? variantLabel;
  const activeStock = active?.stockBySize ?? stockBySize;

  const catalogCover = options[0]?.images[0] ?? images[0] ?? "";
  const catalogStock = aggregateStock(options, sizes, stockBySize);
  const catalogHasStock = sizes.some((size) => (catalogStock[size] ?? 0) > 0);
  const activeHasStock = sizes.some((size) => (activeStock[size] ?? 0) > 0);

  return (
    <aside className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none space-y-5 lg:sticky lg:top-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Vista previa
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Tarjeta del catálogo y ficha con colores como en la tienda.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isPublished ? (
          <Badge
            variant="outline"
            className="border-amber-500/50 text-amber-800 dark:text-amber-300"
          >
            Borrador
          </Badge>
        ) : (
          <Badge variant="secondary">Publicado</Badge>
        )}
        {isNewDrop ? <Badge>Nuevo drop</Badge> : null}
        {options.length > 1 ? (
          <Badge variant="outline">{options.length} colores</Badge>
        ) : null}
      </div>

      <Card className="overflow-hidden shadow-lg rounded-xl bg-card border-border/80">
        <CardContent className="p-0 flex flex-col">
          <div className="relative w-full aspect-[3/4] max-h-[280px] bg-muted">
            {catalogCover ? (
              <AdminPreviewImage
                src={catalogCover}
                alt=""
                fill
                className="object-cover"
                sizes="400px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
            {!catalogHasStock && catalogCover ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <AdminPreviewImage
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
            <h3 className="text-base font-bold leading-snug line-clamp-2 text-foreground">
              {displayName}
            </h3>
            <p className="text-lg font-bold tabular-nums">${price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {activeImages.length > 1 ? (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible shrink-0">
                {activeImages.map((src, index) => (
                  <button
                    key={`${safeColorIndex}-${src}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={cn(
                      "relative shrink-0 w-14 h-14 rounded-md overflow-hidden border-2",
                      safeImageIndex === index
                        ? "border-black"
                        : "border-gray-200"
                    )}
                  >
                    <AdminPreviewImage
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="relative flex-1 aspect-[3/4] max-h-[220px] min-h-[160px] bg-muted rounded-lg overflow-hidden">
              {mainDetail ? (
                <AdminPreviewImage
                  src={mainDetail}
                  alt=""
                  fill
                  className="object-cover rounded-lg"
                  sizes="280px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  Añade fotos a un color
                </div>
              )}
              {!activeHasStock && mainDetail ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <AdminPreviewImage
                    src="/images/sold_out.png"
                    alt="Agotado"
                    width={100}
                    height={100}
                    className="opacity-90"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold leading-tight">{displayName}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{activeLabel}</p>
            <p className="text-base font-semibold tabular-nums mt-2">
              ${price.toFixed(2)}
            </p>
          </div>

          {options.length > 1 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setColorIndex(index);
                      setImageIndex(0);
                    }}
                    className={cn(
                      "relative h-12 w-12 shrink-0 overflow-hidden border-2 bg-white rounded-sm",
                      safeColorIndex === index
                        ? "border-black"
                        : "border-gray-200"
                    )}
                    title={option.label}
                  >
                    <AdminPreviewImage
                      src={option.images[0] ?? ""}
                      alt=""
                      fill
                      className="object-contain p-0.5"
                      sizes="48px"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sizes.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Tamaños (stock del color activo)
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const q = activeStock[size] ?? 0;
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
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({q})
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Descripción
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-4">
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
