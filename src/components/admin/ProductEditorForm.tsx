"use client";

import {
  deleteOrphanUploadAction,
  deleteProductImageAction,
  saveProductAction,
  uploadProductImageAction,
  type SaveProductState,
} from "@/app/admin/dashboard/actions";
import { AdminStorefrontPreview } from "@/components/admin/AdminStorefrontPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminProductRow } from "@/lib/products-repo";
import {
  CATALOG_COLOR_FILTER_OPTIONS,
  COLOR_FILTER_LABELS,
  sortColorFiltersSelected,
} from "@/lib/catalog-color-filters";
import { CATALOG_SIZE_ORDER, sortSizesSelected } from "@/lib/catalog-sizes";
import { isOwnedUploadPath } from "@/lib/product-upload-paths";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

type Props = {
  initial?: AdminProductRow | null;
  /** Vista previa en columna (recomendado en “Nuevo producto”). */
  showLivePreview?: boolean;
};

function encodeWebPath(p: string): string {
  const t = p.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const parts = t.split("/").filter(Boolean);
  if (parts.length === 0) return t;
  return "/" + parts.map(encodeURIComponent).join("/");
}

function deriveInitialSelectedSizes(initial?: AdminProductRow | null): string[] {
  if (!initial) return [...CATALOG_SIZE_ORDER];
  if (initial.sizes.length > 0) {
    return sortSizesSelected(initial.sizes);
  }
  const withStock = CATALOG_SIZE_ORDER.filter((s) => (initial.stockBySize[s] ?? 0) > 0);
  return withStock.length > 0 ? [...withStock] : [...CATALOG_SIZE_ORDER];
}

function deriveInitialColorFilters(initial?: AdminProductRow | null): string[] {
  if (!initial) return ["Black", "White"];
  const sorted = sortColorFiltersSelected(initial.colors);
  return sorted.length > 0 ? sorted : ["Black", "White"];
}

function initStockMap(initial?: AdminProductRow | null): Record<string, number> {
  const o: Record<string, number> = {};
  for (const s of CATALOG_SIZE_ORDER) {
    o[s] = initial?.stockBySize[s] ?? 0;
  }
  return o;
}

function stockFingerprint(initial?: AdminProductRow | null): string {
  if (!initial) return "";
  return CATALOG_SIZE_ORDER.map((s) => initial.stockBySize[s] ?? 0).join("-");
}

function colorsFingerprint(initial?: AdminProductRow | null): string {
  if (!initial) return "";
  return initial.colors?.join("|") ?? "";
}

export function ProductEditorForm({ initial, showLivePreview = false }: Props) {
  const [state, formAction, pending] = useActionState(saveProductAction, null as SaveProductState);
  const [name, setName] = useState(initial?.name ?? "");
  const [priceStr, setPriceStr] = useState(
    initial?.price != null ? String(initial.price) : ""
  );
  const [description, setDescription] = useState(initial?.desc ?? "");
  const [imagePaths, setImagePaths] = useState<string[]>(() => initial?.images ?? []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => deriveInitialSelectedSizes(initial));
  const [selectedColors, setSelectedColors] = useState<string[]>(() => deriveInitialColorFilters(initial));
  const [stockBySize, setStockBySize] = useState<Record<string, number>>(() => initStockMap(initial));
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [isNewDrop, setIsNewDrop] = useState(initial?.new_drop_sort != null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [imgPending, startImgTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const productId = initial?.id;

  const variantLabelForSubmit =
    productId != null
      ? (initial?.color ?? "")
      : sortColorFiltersSelected(selectedColors)
          .map((c) => COLOR_FILTER_LABELS[c as keyof typeof COLOR_FILTER_LABELS])
          .join(" · ") || "Sin variante";

  const previewPrice = Number.parseFloat(priceStr.replace(",", ".")) || 0;
  const previewSizes = sortSizesSelected(selectedSizes);

  useEffect(() => {
    setName(initial?.name ?? "");
    setPriceStr(initial?.price != null ? String(initial.price) : "");
    setDescription(initial?.desc ?? "");
    setImagePaths(initial?.images ?? []);
    setIsPublished(initial?.is_published ?? true);
    setIsNewDrop(initial?.new_drop_sort != null);
  }, [initial?.id, initial?.name, initial?.price, initial?.desc, initial?.images?.join("|"), initial?.is_published, initial?.new_drop_sort]);

  useEffect(() => {
    setSelectedSizes(deriveInitialSelectedSizes(initial));
  }, [initial?.id, initial?.sizes?.join("|"), stockFingerprint(initial)]);

  useEffect(() => {
    setSelectedColors(deriveInitialColorFilters(initial));
  }, [initial?.id, colorsFingerprint(initial)]);

  useEffect(() => {
    setStockBySize(initStockMap(initial));
  }, [initial?.id, stockFingerprint(initial)]);

  useEffect(() => {
    setStockBySize((prev) => {
      const next = { ...prev };
      for (const s of CATALOG_SIZE_ORDER) {
        if (!selectedSizes.includes(s)) next[s] = 0;
      }
      return next;
    });
  }, [selectedSizes]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadMsg(null);
    startImgTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadProductImageAction(fd);
        if (res.error) setUploadMsg(res.error);
        else {
          const path = res.path;
          if (path) setImagePaths((prev) => [...prev, path]);
        }
      } catch {
        setUploadMsg(
          "No se pudo subir la imagen (fallo de red o del servidor). Comprueba la conexión e inténtalo de nuevo."
        );
      }
    });
  }

  async function removeImage(path: string) {
    setUploadMsg(null);
    if (productId != null) {
      startImgTransition(async () => {
        try {
          const r = await deleteProductImageAction(productId, path);
          if (r.error) setUploadMsg(r.error);
          else setImagePaths((prev) => prev.filter((x) => x !== path));
        } catch {
          setUploadMsg("No se pudo quitar la imagen. Inténtalo de nuevo.");
        }
      });
    } else {
      if (isOwnedUploadPath(path)) {
        try {
          const r = await deleteOrphanUploadAction(path);
          if (r.error) {
            setUploadMsg(r.error);
            return;
          }
        } catch {
          setUploadMsg("No se pudo eliminar el archivo subido. Inténtalo de nuevo.");
          return;
        }
      }
      setImagePaths((prev) => prev.filter((x) => x !== path));
    }
  }

  const formInner = (
    <form
      action={formAction}
      className={cn("space-y-8 min-w-0", !showLivePreview && "max-w-3xl")}
    >
      {productId != null ? <input type="hidden" name="id" value={productId} /> : null}
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {state.error}
        </p>
      ) : null}
      {uploadMsg ? (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2">
          {uploadMsg}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <input type="hidden" name="variant_label" value={variantLabelForSubmit} />

      <div className="space-y-2 max-w-sm">
        <Label htmlFor="price">Precio</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          value={priceStr}
          onChange={(e) => setPriceStr(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div>
          <Label className="text-base">Imágenes</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Sube archivos (local:{" "}
            <code className="text-xs bg-muted px-1 rounded">public/uploads/products</code>
            ; en Vercel con Cloudinary: <code className="text-xs bg-muted px-1 rounded">CLOUDINARY_*</code>).
            {productId != null
              ? " Las fotos subidas por el panel se eliminan al quitarlas o al guardar si ya no figuran en la lista (no afecta imágenes históricas de /images/… de la tienda)."
              : " Las fotos subidas se pueden quitar antes de guardar; el archivo también se elimina del almacenamiento."}
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onPickFile}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={imgPending || pending}
            onClick={() => fileRef.current?.click()}
          >
            {imgPending ? "Subiendo…" : "Subir imagen"}
          </Button>
        </div>

        {imagePaths.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePaths.map((src) => (
              <li
                key={src}
                className="relative aspect-square rounded-lg border bg-background overflow-hidden group"
              >
                <Image
                  src={encodeWebPath(src)}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="200px"
                  unoptimized
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-md bg-black/70 text-white text-xs px-2 py-1 opacity-90 hover:bg-black"
                  disabled={imgPending || pending}
                  onClick={() => removeImage(src)}
                >
                  Quitar
                </button>
                <input type="hidden" name="images" value={src} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay imágenes.</p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/15 p-4">
        <div>
          <Label className="text-base">Etiquetas de color (filtros)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Opciones del catálogo legado. En la base se guardan en inglés (Black, White…); aquí ves el nombre en
            español.
          </p>
        </div>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={selectedColors}
          onValueChange={(v) => setSelectedColors(v)}
          className="justify-start"
        >
          {CATALOG_COLOR_FILTER_OPTIONS.map((key) => (
            <ToggleGroupItem key={key} value={key} aria-label={COLOR_FILTER_LABELS[key]}>
              {COLOR_FILTER_LABELS[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {sortColorFiltersSelected(selectedColors).map((c) => (
          <input key={c} type="hidden" name="color_filters" value={c} />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/15 p-4">
        <div>
          <Label className="text-base">Tallas disponibles</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Activa las tallas que vendes. El stock solo aplica a las tallas seleccionadas.
          </p>
        </div>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={selectedSizes}
          onValueChange={(v) => setSelectedSizes(v)}
          className="justify-start"
        >
          {CATALOG_SIZE_ORDER.map((size) => (
            <ToggleGroupItem key={size} value={size} aria-label={`Talla ${size}`}>
              {size}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {sortSizesSelected(selectedSizes).map((s) => (
          <input key={s} type="hidden" name="sizes" value={s} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {sortSizesSelected(selectedSizes).map((size) => (
          <div key={size} className="space-y-2">
            <Label htmlFor={`stock_${size}`}>Stock {size}</Label>
            <Input
              id={`stock_${size}`}
              name={`stock_${size}`}
              type="number"
              min="0"
              value={String(stockBySize[size] ?? 0)}
              onChange={(e) =>
                setStockBySize((prev) => ({
                  ...prev,
                  [size]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border rounded-lg p-4 bg-muted/20">
        <input type="hidden" name="is_published" value={isPublished ? "true" : "false"} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4"
          />
          Publicado en la tienda
        </label>
        <input type="hidden" name="is_new_drop" value={isNewDrop ? "true" : "false"} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isNewDrop}
            onChange={(e) => setIsNewDrop(e.target.checked)}
            className="h-4 w-4"
          />
          Mostrar en carrusel &quot;Nuevos Drops&quot;
        </label>
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="new_drop_sort">Orden en Nuevos Drops (menor = primero)</Label>
          <Input
            id="new_drop_sort"
            name="new_drop_sort"
            type="number"
            defaultValue={initial?.new_drop_sort ?? 0}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || imgPending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );

  if (!showLivePreview) {
    return formInner;
  }

  return (
    <div className="grid w-full gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
      {formInner}
      <AdminStorefrontPreview
        name={name}
        price={previewPrice}
        images={imagePaths}
        variantLabel={variantLabelForSubmit}
        description={description}
        sizes={previewSizes}
        stockBySize={stockBySize}
        isPublished={isPublished}
        isNewDrop={isNewDrop}
      />
    </div>
  );
}
