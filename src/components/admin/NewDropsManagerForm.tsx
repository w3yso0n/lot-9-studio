"use client";

import {
  saveNewDropsAction,
  type SaveNewDropsState,
} from "@/app/admin/dashboard/new-drops/actions";
import { AdminPreviewImage } from "@/components/admin/AdminPreviewImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AdminNewDropProduct } from "@/lib/new-drops-repo";
import { useActionState, useMemo, useState } from "react";

type DraftItem = AdminNewDropProduct;

type Props = {
  products: AdminNewDropProduct[];
};

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export function NewDropsManagerForm({ products }: Props) {
  const [state, formAction, pending] = useActionState(
    saveNewDropsAction,
    null as SaveNewDropsState
  );
  const [items, setItems] = useState<DraftItem[]>(products);

  const selectedCount = useMemo(
    () => items.filter((item) => item.isSelected).length,
    [items]
  );

  function toggleProduct(productId: number, isSelected: boolean) {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === productId ? { ...item, isSelected } : item
      );
      return [...next].sort((a, b) => {
        if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      });
    });
  }

  function updateSelectedImage(productId: number, imagePath: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, selectedImagePath: imagePath } : item
      )
    );
  }

  function moveSelected(productId: number, direction: -1 | 1) {
    setItems((prev) => {
      const selected = prev.filter((item) => item.isSelected);
      const rest = prev.filter((item) => !item.isSelected);
      const index = selected.findIndex((item) => item.id === productId);
      const moved = moveArrayItem(selected, index, index + direction);
      return [...moved, ...rest].map((item, sortOrder) => ({ ...item, sortOrder }));
    });
  }

  const selectedItems = items.filter((item) => item.isSelected);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          New Drops guardado.
        </p>
      ) : null}

      {selectedItems.map((item) => (
        <div key={`selected-${item.id}`}>
          <input type="hidden" name="new_drop_product_ids" value={item.id} />
          <input
            type="hidden"
            name="new_drop_selected_images"
            value={item.selectedImagePath || item.fallbackImagePath}
          />
        </div>
      ))}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {selectedCount} productos seleccionados para el carrusel.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar New Drops"}
        </Button>
      </div>

      <ul className="space-y-4">
        {items.map((product) => {
          const selectedImage = product.selectedImagePath || product.fallbackImagePath;
          const selectedIndex = selectedItems.findIndex((item) => item.id === product.id);

          return (
            <li key={product.id}>
              <Card className="overflow-hidden">
                <CardContent className="grid gap-4 p-4 md:grid-cols-[140px_minmax(0,1fr)]">
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {selectedImage ? (
                      <AdminPreviewImage
                        src={selectedImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold leading-snug">
                            {product.name}
                          </h2>
                          {!product.isPublished ? (
                            <Badge variant="outline">Borrador</Badge>
                          ) : null}
                          {product.isSelected ? <Badge>En New Drops</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.color}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {product.oldPrice != null &&
                          product.oldPrice > 1 &&
                          product.oldPrice > product.price ? (
                            <span className="text-sm text-muted-foreground line-through">
                              ${formatPrice(product.oldPrice)}
                            </span>
                          ) : null}
                          <span className="text-lg font-semibold">
                            ${formatPrice(product.price)}
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={product.isSelected}
                          onChange={(e) =>
                            toggleProduct(product.id, e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        Mostrar
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`new-drop-image-${product.id}`}>
                          Imagen del carrusel
                        </Label>
                        <select
                          id={`new-drop-image-${product.id}`}
                          value={selectedImage}
                          onChange={(e) =>
                            updateSelectedImage(product.id, e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                        >
                          {product.images.map((image, index) => (
                            <option key={`${product.id}-${image}`} value={image}>
                              {image === product.fallbackImagePath
                                ? `Portada / fallback (${index + 1})`
                                : `Imagen ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!product.isSelected || selectedIndex <= 0}
                          onClick={() => moveSelected(product.id, -1)}
                        >
                          Subir
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            !product.isSelected ||
                            selectedIndex < 0 ||
                            selectedIndex >= selectedItems.length - 1
                          }
                          onClick={() => moveSelected(product.id, 1)}
                        >
                          Bajar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </form>
  );
}
