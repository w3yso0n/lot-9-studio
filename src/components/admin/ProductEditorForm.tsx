"use client";

import {
  deleteProductImageAction,
  deleteOrphanUploadAction,
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

type ColorVariantImageDraft = {
  id: string;
  imagePath: string;
  preview?: string;
  file?: File;
};
type PendingUpload = { id: string; file: File; preview: string };
type ColorVariantDraft = {
  id: string;
  label: string;
  images: ColorVariantImageDraft[];
  stockBySize: Record<string, number>;
};

type Props = {
  initial?: AdminProductRow | null;
  /** Vista previa en columna (recomendado en “Nuevo producto”). */
  showLivePreview?: boolean;
};

type ProductWithOldPrice = AdminProductRow & {
  oldPrice?: number | null;
  old_price?: number | null;
};

function getInitialOldPrice(initial?: AdminProductRow | null): number | null {
  const product = initial as ProductWithOldPrice | null | undefined;
  return product?.oldPrice ?? product?.old_price ?? null;
}

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
  const withStock = CATALOG_SIZE_ORDER.filter(
    (s) => (initial.stockBySize[s] ?? 0) > 0
  );
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

function initColorVariants(initial?: AdminProductRow | null): ColorVariantDraft[] {
  return (initial?.colorVariants ?? []).map((variant, index) => ({
    id: `saved-${index}-${variant.images.join("~")}`,
    label: variant.label,
    images: variant.images.map((image, imageIndex) => ({
      id: `saved-${index}-${imageIndex}-${image}`,
      imagePath: image,
    })),
    stockBySize: { ...variant.stockBySize },
  }));
}

export function ProductEditorForm({
  initial,
  showLivePreview = false,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    null as SaveProductState
  );

  const [name, setName] = useState(initial?.name ?? "");

  const [priceStr, setPriceStr] = useState(
    initial?.price != null ? String(initial.price) : ""
  );

  const [oldPriceStr, setOldPriceStr] = useState(() => {
    const oldPrice = getInitialOldPrice(initial);
    return oldPrice != null ? String(oldPrice) : "";
  });

  const [description, setDescription] = useState(initial?.desc ?? "");
  const [imagePaths, setImagePaths] = useState<string[]>(
    () => initial?.images ?? []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() =>
    deriveInitialSelectedSizes(initial)
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(() =>
    deriveInitialColorFilters(initial)
  );
  const [colorVariants, setColorVariants] = useState<ColorVariantDraft[]>(() =>
    initColorVariants(initial)
  );
  const [stockBySize, setStockBySize] = useState<Record<string, number>>(() =>
    initStockMap(initial)
  );
  const [isPublished, setIsPublished] = useState(
    initial?.is_published ?? true
  );
  const [isNewDrop, setIsNewDrop] = useState(
    initial?.new_drop_sort != null
  );
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [imgPending, startImgTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const colorVariantFileRef = useRef<HTMLInputElement>(null);
  const colorVariantUploadTargetRef = useRef<string | null>(null);
  const pendingUploadsRef = useRef<PendingUpload[]>([]);
  const colorVariantsRef = useRef<ColorVariantDraft[]>([]);

  const productId = initial?.id;

  const variantLabelForSubmit =
    productId != null
      ? initial?.color ?? ""
      : sortColorFiltersSelected(selectedColors)
          .map((c) => COLOR_FILTER_LABELS[c as keyof typeof COLOR_FILTER_LABELS])
          .join(" · ") || "Sin variante";

  const previewPrice = Number.parseFloat(priceStr.replace(",", ".")) || 0;
  const previewSizes = sortSizesSelected(selectedSizes);
  const previewImages =
    colorVariants[0]?.images
      .map((image) => image.preview ?? image.imagePath)
      .filter(Boolean) ?? [];
  const previewStockBySize = CATALOG_SIZE_ORDER.reduce<Record<string, number>>(
    (acc, size) => {
      acc[size] =
        colorVariants.length > 0
          ? colorVariants.reduce(
              (sum, variant) => sum + (variant.stockBySize[size] ?? 0),
              0
            )
          : stockBySize[size] ?? 0;
      return acc;
    },
    {}
  );
  const hasPendingColorVariantUploads = colorVariants.some((variant) =>
    variant.images.some((image) => image.file)
  );

  pendingUploadsRef.current = pendingUploads;
  colorVariantsRef.current = colorVariants;

  useEffect(() => {
    return () => {
      for (const p of pendingUploadsRef.current) {
        URL.revokeObjectURL(p.preview);
      }
      for (const variant of colorVariantsRef.current) {
        for (const image of variant.images) {
          if (image.preview) URL.revokeObjectURL(image.preview);
        }
      }
    };
  }, []);

  useEffect(() => {
    const oldPrice = getInitialOldPrice(initial);

    setName(initial?.name ?? "");
    setPriceStr(initial?.price != null ? String(initial.price) : "");
    setOldPriceStr(oldPrice != null ? String(oldPrice) : "");
    setDescription(initial?.desc ?? "");
    setImagePaths(initial?.images ?? []);
    setColorVariants(initColorVariants(initial));
    setIsPublished(initial?.is_published ?? true);
    setIsNewDrop(initial?.new_drop_sort != null);

    if (!initial?.id) setPendingUploads([]);
  }, [
    initial?.id,
    initial?.name,
    initial?.price,
    getInitialOldPrice(initial),
    initial?.desc,
    initial?.images?.join("|"),
    initial?.is_published,
    initial?.new_drop_sort,
  ]);

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

    setColorVariants((prev) =>
      prev.map((variant) => {
        const next = { ...variant.stockBySize };
        for (const s of CATALOG_SIZE_ORDER) {
          if (!selectedSizes.includes(s)) next[s] = 0;
        }
        return { ...variant, stockBySize: next };
      })
    );
  }, [selectedSizes]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadMsg(null);

    if (productId != null) {
      startImgTransition(async () => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadProductImageAction(fd);

          if (res.error) {
            setUploadMsg(res.error);
          } else {
            const path = res.path;
            if (path) setImagePaths((prev) => [...prev, path]);
          }
        } catch {
          setUploadMsg(
            "No se pudo subir la imagen (fallo de red o del servidor). Comprueba la conexión e inténtalo de nuevo."
          );
        }
      });
      return;
    }

    if (file.size === 0) {
      setUploadMsg("Archivo vacío.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg("El archivo supera 5 MB.");
      return;
    }

    const okTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!okTypes.includes(file.type)) {
      setUploadMsg("Formato no permitido. Usa JPEG, PNG, WebP o GIF.");
      return;
    }

    const preview = URL.createObjectURL(file);
    const id = crypto.randomUUID();

    setPendingUploads((prev) => [...prev, { id, file, preview }]);
  }

  function removePendingUpload(id: string) {
    setUploadMsg(null);

    setPendingUploads((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function removeImage(path: string) {
    setUploadMsg(null);

    if (productId != null) {
      startImgTransition(async () => {
        try {
          const r = await deleteProductImageAction(productId, path);

          if (r.error) {
            setUploadMsg(r.error);
          } else {
            setImagePaths((prev) => prev.filter((x) => x !== path));
          }
        } catch {
          setUploadMsg("No se pudo quitar la imagen. Inténtalo de nuevo.");
        }
      });
    }
  }

  function onPickColorVariantFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadMsg(null);

    if (file.size === 0) {
      setUploadMsg("Archivo vacío.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg("El archivo supera 5 MB.");
      return;
    }

    const okTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!okTypes.includes(file.type)) {
      setUploadMsg("Formato no permitido. Usa JPEG, PNG, WebP o GIF.");
      return;
    }

    const targetId = colorVariantUploadTargetRef.current;
    colorVariantUploadTargetRef.current = null;
    const label = `Color ${colorVariants.length + 1}`;

    if (productId != null) {
      startImgTransition(async () => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadProductImageAction(fd);

          if (res.error) {
            setUploadMsg(res.error);
          } else if (res.path) {
            const imagePath = res.path;
            const image: ColorVariantImageDraft = {
              id: crypto.randomUUID(),
              imagePath,
            };
            setColorVariants((prev) => {
              if (targetId) {
                return prev.map((variant) =>
                  variant.id === targetId
                    ? { ...variant, images: [...variant.images, image] }
                    : variant
                );
              }

              return [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  label,
                  images: [image],
                  stockBySize: initStockMap(initial),
                },
              ];
            });
          }
        } catch {
          setUploadMsg("No se pudo subir la imagen. Inténtalo de nuevo.");
        }
      });
      return;
    }

    const image: ColorVariantImageDraft = {
      id: crypto.randomUUID(),
      imagePath: "",
      preview: URL.createObjectURL(file),
      file,
    };

    setColorVariants((prev) => {
      if (targetId) {
        return prev.map((variant) =>
          variant.id === targetId
            ? { ...variant, images: [...variant.images, image] }
            : variant
        );
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          label,
          images: [image],
          stockBySize: initStockMap(initial),
        },
      ];
    });
  }

  function pickColorVariantImage(variantId?: string) {
    colorVariantUploadTargetRef.current = variantId ?? null;
    colorVariantFileRef.current?.click();
  }

  function updateColorVariantLabel(id: string, label: string) {
    setColorVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, label } : variant
      )
    );
  }

  function updateColorVariantStock(
    id: string,
    size: string,
    quantity: number
  ) {
    setColorVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              stockBySize: {
                ...variant.stockBySize,
                [size]: Math.max(0, Math.floor(quantity || 0)),
              },
            }
          : variant
      )
    );
  }

  function removeColorVariant(id: string) {
    setUploadMsg(null);

    const savedImages = new Set(
      (initial?.colorVariants ?? []).flatMap((variant) => variant.images)
    );

    setColorVariants((prev) => {
      const item = prev.find((variant) => variant.id === id);
      for (const image of item?.images ?? []) {
        if (image.preview) URL.revokeObjectURL(image.preview);
        if (productId != null && image.imagePath && !savedImages.has(image.imagePath)) {
          void deleteOrphanUploadAction(image.imagePath);
        }
      }
      return prev.filter((variant) => variant.id !== id);
    });
  }

  function removeColorVariantImage(variantId: string, imageId: string) {
    setUploadMsg(null);

    const savedImages = new Set(
      (initial?.colorVariants ?? []).flatMap((variant) => variant.images)
    );

    setColorVariants((prev) =>
      prev
        .map((variant) => {
          if (variant.id !== variantId) return variant;
          const item = variant.images.find((image) => image.id === imageId);
          if (item?.preview) URL.revokeObjectURL(item.preview);
          if (productId != null && item?.imagePath && !savedImages.has(item.imagePath)) {
            void deleteOrphanUploadAction(item.imagePath);
          }
          return {
            ...variant,
            images: variant.images.filter((image) => image.id !== imageId),
          };
        })
        .filter((variant) => variant.images.length > 0)
    );
  }

  const formInner = (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (productId != null) return;

        e.preventDefault();

        const fd = new FormData(e.currentTarget);

        for (const p of pendingUploads) {
          fd.append("pending_images", p.file);
        }

        for (const variant of colorVariants) {
          for (const image of variant.images) {
            if (image.file) {
              fd.append("pending_color_variant_images", image.file);
            }
          }
        }

        startTransition(() => {
          void formAction(fd);
        });
      }}
      className={cn("space-y-8 min-w-0", !showLivePreview && "max-w-3xl")}
    >
      {productId != null ? (
        <input type="hidden" name="id" value={productId} />
      ) : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Precio actual</Label>
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
          <Label htmlFor="old_price">Precio anterior / oferta</Label>
          <Input
            id="old_price"
            name="old_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 399.99"
            value={oldPriceStr}
            onChange={(e) => setOldPriceStr(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Si lo dejas vacío, en 0 o menor a 1, no se mostrará precio tachado.
          </p>
        </div>
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

      <div className="hidden">
        <div>
          <Label className="text-base">Imágenes</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {productId != null ? (
              <>
                Sube archivos (local:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  public/uploads/products
                </code>
                ; con Cloudinary:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  CLOUDINARY_*
                </code>
                ). Las fotos subidas se eliminan del almacenamiento al quitarlas
                o si dejan de figurar al guardar (no afecta imágenes de{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  /images/
                </code>
                …).
              </>
            ) : (
              <>
                Las imágenes nuevas no se suben a Cloudinary hasta que pulses{" "}
                <strong>Guardar</strong>. Puedes quitar una imagen de la lista
                antes de guardar (no se sube nada a la nube). Requisitos: JPEG,
                PNG, WebP o GIF, máx. 5 MB.
              </>
            )}
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
            disabled={(productId != null ? imgPending : false) || pending}
            onClick={() => fileRef.current?.click()}
          >
            {imgPending
              ? "Subiendo…"
              : productId != null
              ? "Subir imagen"
              : "Añadir imagen"}
          </Button>
        </div>

        {productId != null && imagePaths.length > 0 ? (
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
        ) : productId == null && pendingUploads.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pendingUploads.map((p) => (
              <li
                key={p.id}
                className="relative aspect-square rounded-lg border bg-background overflow-hidden group"
              >
                <Image
                  src={p.preview}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="200px"
                  unoptimized
                />

                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-md bg-black/70 text-white text-xs px-2 py-1 opacity-90 hover:bg-black"
                  disabled={pending}
                  onClick={() => removePendingUpload(p.id)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay imágenes.</p>
        )}
      </div>

      <div className="hidden">
        <div>
          <Label className="text-base">Tallas disponibles</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Activa las tallas que vendes para este modelo. El stock de cada
            color se captura en la seccion de modelos/colores.
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
            <ToggleGroupItem
              key={size}
              value={size}
              aria-label={`Talla ${size}`}
            >
              {size}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {sortSizesSelected(selectedSizes).map((s) => (
          <input key={s} type="hidden" name="sizes" value={s} />
        ))}
      </div>

      <div className="hidden">
        {sortSizesSelected(selectedSizes).map((size) => (
          <div key={size} className="space-y-2">
            <Label htmlFor={`stock_${size}`}>Stock base {size}</Label>
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

      <div className="hidden">
        <div>
          <Label className="text-base">Etiquetas de color (filtros)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Opciones del catálogo legado. En la base se guardan en inglés
            (Black, White…); aquí ves el nombre en español.
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
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={COLOR_FILTER_LABELS[key]}
            >
              {COLOR_FILTER_LABELS[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {sortColorFiltersSelected(selectedColors).map((c) => (
          <input key={c} type="hidden" name="color_filters" value={c} />
        ))}
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
        <div>
          <Label className="text-base">Colores del modelo</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Sube una o varias fotos por cada color. La primera imagen del
            primer color será la portada del producto.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border bg-background p-3">
          <Label className="text-sm">Tallas disponibles del modelo</Label>

          <ToggleGroup
            type="multiple"
            variant="outline"
            value={selectedSizes}
            onValueChange={(v) => setSelectedSizes(v)}
            className="justify-start"
          >
            {CATALOG_SIZE_ORDER.map((size) => (
              <ToggleGroupItem
                key={size}
                value={size}
                aria-label={`Talla ${size}`}
              >
                {size}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {sortSizesSelected(selectedSizes).map((s) => (
            <input key={s} type="hidden" name="sizes" value={s} />
          ))}
        </div>

        <input
          ref={colorVariantFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onPickColorVariantFile}
        />

        <Button
          type="button"
          variant="secondary"
          disabled={(productId != null ? imgPending : false) || pending}
          onClick={() => pickColorVariantImage()}
        >
          {imgPending ? "Subiendo..." : "Crear color con imagen"}
        </Button>

        {colorVariants.length > 0 ? (
          <ul className="space-y-4">
            {colorVariants.map((variant, variantIndex) => (
              <li
                key={variant.id}
                className="space-y-3 rounded-lg border bg-background p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Input
                    value={variant.label}
                    onChange={(e) =>
                      updateColorVariantLabel(variant.id, e.target.value)
                    }
                    placeholder="Nombre del color"
                    className="h-9 sm:max-w-xs"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={(productId != null ? imgPending : false) || pending}
                      onClick={() => pickColorVariantImage(variant.id)}
                    >
                      Añadir foto
                    </Button>

                    <button
                      type="button"
                      className="rounded-md bg-black/80 px-3 py-2 text-xs text-white hover:bg-black"
                      disabled={pending}
                      onClick={() => removeColorVariant(variant.id)}
                    >
                      Quitar color
                    </button>
                  </div>
                </div>

                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {variant.images.map((image) => {
                    const src = image.preview ?? image.imagePath;

                    return (
                      <li
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-md border bg-muted"
                      >
                        {src ? (
                          <Image
                            src={image.preview ?? encodeWebPath(src)}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="160px"
                            unoptimized
                          />
                        ) : null}

                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black"
                          disabled={pending}
                          onClick={() =>
                            removeColorVariantImage(variant.id, image.id)
                          }
                        >
                          Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {sortSizesSelected(selectedSizes).map((size) => (
                    <div key={size} className="space-y-1.5">
                      <Label
                        htmlFor={`color_variant_stock_${variantIndex}_${size}`}
                        className="text-xs"
                      >
                        Stock {size}
                      </Label>
                      <Input
                        id={`color_variant_stock_${variantIndex}_${size}`}
                        name={`color_variant_stock_${variantIndex}_${size}`}
                        type="number"
                        min="0"
                        value={String(variant.stockBySize[size] ?? 0)}
                        onChange={(e) =>
                          updateColorVariantStock(
                            variant.id,
                            size,
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <input
                  type="hidden"
                  name="color_variant_labels"
                  value={variant.label}
                />
                <input
                  type="hidden"
                  name="color_variant_images"
                  value={variant.images
                    .map((image) => image.imagePath || "__pending__")
                    .join("|")}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay imágenes de colores.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border rounded-lg p-4 bg-muted/20">
        <input
          type="hidden"
          name="is_published"
          value={isPublished ? "true" : "false"}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4"
          />
          Publicado en la tienda
        </label>

        <input
          type="hidden"
          name="is_new_drop"
          value={isNewDrop ? "true" : "false"}
        />

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
          <Label htmlFor="new_drop_sort">
            Orden en Nuevos Drops (menor = primero)
          </Label>
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
          {pending
            ? "Guardando…"
            : productId == null &&
              (pendingUploads.length > 0 || hasPendingColorVariantUploads)
            ? "Guardar y subir imágenes"
            : "Guardar"}
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
        images={previewImages}
        variantLabel={variantLabelForSubmit}
        description={description}
        sizes={previewSizes}
        stockBySize={previewStockBySize}
        isPublished={isPublished}
        isNewDrop={isNewDrop}
      />
    </div>
  );
}
