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
import { AdminPreviewImage } from "@/components/admin/AdminPreviewImage";
import { GripVertical } from "lucide-react";
import Image from "next/image";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const IMAGE_OK_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (file.size === 0) return "Archivo vacío.";
  if (file.size > MAX_IMAGE_BYTES) return "El archivo supera 5 MB.";
  if (!IMAGE_OK_TYPES.includes(file.type as (typeof IMAGE_OK_TYPES)[number])) {
    return "Formato no permitido. Usa JPEG, PNG, WebP o GIF.";
  }
  return null;
}

type ColorVariantImageDraft = {
  id: string;
  imagePath: string;
  preview?: string;
  file?: File;
};
type UploadingPreview = {
  id: string;
  preview: string;
};
type ColorVariantDraft = {
  id: string;
  label: string;
  images: ColorVariantImageDraft[];
  stockBySize: Record<string, number>;
};

const SUGGESTED_COLOR_NAMES = ["Negra", "Blanca", "Hueso", "Gris"] as const;

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

function appendColorVariantImages(
  prev: ColorVariantDraft[],
  targetId: string | null,
  newImages: ColorVariantImageDraft[],
  initial?: AdminProductRow | null
): ColorVariantDraft[] {
  if (newImages.length === 0) return prev;

  if (targetId) {
    return prev.map((variant) =>
      variant.id === targetId
        ? { ...variant, images: [...variant.images, ...newImages] }
        : variant
    );
  }

  const newVariant: ColorVariantDraft = {
    id: crypto.randomUUID(),
    label: `Color ${prev.length + 1}`,
    images: newImages,
    stockBySize: initStockMap(initial),
  };

  return [...prev, newVariant];
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return items;
  next.splice(toIndex, 0, item);
  return next;
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
  const [coverImagePath, setCoverImagePath] = useState(
    () => initial?.coverImage ?? ""
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
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [imgPending, setImgPending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingPreview[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorVariantFileRef = useRef<HTMLInputElement>(null);
  const colorVariantUploadTargetRef = useRef<string | null>(null);
  const uploadingImagesRef = useRef<UploadingPreview[]>([]);
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
  const usesColorVariants = colorVariants.length > 0;

  const previewImages = useMemo(() => {
    const fromVariant = colorVariants[0]?.images
      .map((image) => image.preview ?? image.imagePath)
      .filter(Boolean);
    if (fromVariant && fromVariant.length > 0) return fromVariant;
    if (imagePaths.length > 0) return imagePaths;
    return uploadingImages.map((image) => image.preview);
  }, [colorVariants, imagePaths, uploadingImages]);
  const allProductImagePaths = useMemo(
    () => [
      ...imagePaths,
      ...colorVariants.flatMap((variant) =>
        variant.images.map((image) => image.imagePath).filter(Boolean)
      ),
    ],
    [colorVariants, imagePaths]
  );
  const fallbackCoverImagePath = allProductImagePaths[0] ?? "";
  const effectiveCoverImagePath = coverImagePath || fallbackCoverImagePath;
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
  uploadingImagesRef.current = uploadingImages;
  colorVariantsRef.current = colorVariants;

  useEffect(() => {
    return () => {
      for (const image of uploadingImagesRef.current) {
        URL.revokeObjectURL(image.preview);
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
    setCoverImagePath(initial?.coverImage ?? "");
    setColorVariants(initColorVariants(initial));
    setIsPublished(initial?.is_published ?? true);
    setUploadingImages([]);
  }, [
    initial?.id,
    initial?.name,
    initial?.price,
    getInitialOldPrice(initial),
    initial?.desc,
    initial?.images?.join("|"),
    initial?.coverImage,
    initial?.is_published,
  ]);

  useEffect(() => {
    if (!coverImagePath) return;
    if (!allProductImagePaths.includes(coverImagePath)) {
      setCoverImagePath("");
    }
  }, [allProductImagePaths, coverImagePath]);

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
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadMsg(null);

    for (const file of files) {
      const err = validateImageFile(file);
      if (err) {
        setUploadMsg(err);
        return;
      }
    }

    const previews = files.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
    }));
    setUploadingImages((prev) => [...prev, ...previews]);
    setImgPending(true);
    void (async () => {
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const preview = previews[i];
            const fd = new FormData();
            fd.append("file", file);
            const res = await uploadProductImageAction(fd);
            if (res.error) {
              setUploadMsg(res.error);
              return;
            }
            if (res.path) {
              setImagePaths((prev) => [...prev, res.path!]);
              setUploadingImages((prev) =>
                prev.filter((image) => image.id !== preview.id)
              );
              URL.revokeObjectURL(preview.preview);
            }
          }
        } catch {
          setUploadMsg(
            "No se pudo subir la imagen (fallo de red o del servidor). Comprueba la conexión e inténtalo de nuevo."
          );
        }
        finally {
        setUploadingImages((prev) =>
          prev.filter(
            (image) => !previews.some((preview) => preview.id === image.id)
          )
        );
        for (const preview of previews) URL.revokeObjectURL(preview.preview);
        setImgPending(false);
      }
    })();

  }

  function removeImage(path: string) {
    setUploadMsg(null);
    if (coverImagePath === path) setCoverImagePath("");

    setImgPending(true);
    void (async () => {
      try {
        if (productId != null) {
          const r = await deleteProductImageAction(productId, path);

          if (r.error) {
            setUploadMsg(r.error);
          } else {
            setImagePaths((prev) => prev.filter((x) => x !== path));
          }
          return;
        }

        const r = await deleteOrphanUploadAction(path);
        if (r.error) {
          setUploadMsg(r.error);
        } else {
          setImagePaths((prev) => prev.filter((x) => x !== path));
        }
      } catch {
          setUploadMsg("No se pudo quitar la imagen. Inténtalo de nuevo.");
        }
      finally {
        setImgPending(false);
      }
    })();
  }

  function onPickColorVariantFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadMsg(null);

    for (const file of files) {
      const err = validateImageFile(file);
      if (err) {
        setUploadMsg(err);
        return;
      }
    }

    const targetId = colorVariantUploadTargetRef.current;
    colorVariantUploadTargetRef.current = null;

    setImgPending(true);
    void (async () => {
        try {
          const uploaded: ColorVariantImageDraft[] = [];
          for (const file of files) {
            const fd = new FormData();
            fd.append("file", file);
            const res = await uploadProductImageAction(fd);
            if (res.error) {
              setUploadMsg(res.error);
              return;
            }
            if (res.path) {
              uploaded.push({
                id: crypto.randomUUID(),
                imagePath: res.path,
              });
            }
          }
          if (uploaded.length === 0) return;
          setColorVariants((prev) =>
            appendColorVariantImages(prev, targetId, uploaded, initial)
          );
        } catch {
          setUploadMsg("No se pudo subir la imagen. Inténtalo de nuevo.");
        }
      finally {
        setImgPending(false);
      }
    })();
  }

  function pickColorVariantImage(variantId?: string) {
    colorVariantUploadTargetRef.current = variantId ?? null;
    colorVariantFileRef.current?.click();
  }

  function addColorVariant() {
    setColorVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        images: [],
        stockBySize: initStockMap(initial),
      },
    ]);
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
    const item = colorVariants.find((variant) => variant.id === id);
    if (item?.images.some((image) => image.imagePath === coverImagePath)) {
      setCoverImagePath("");
    }

    setColorVariants((prev) => {
      for (const image of item?.images ?? []) {
        if (image.preview) URL.revokeObjectURL(image.preview);
        if (image.imagePath && !savedImages.has(image.imagePath)) {
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
    const selectedImage = colorVariants
      .find((variant) => variant.id === variantId)
      ?.images.find((image) => image.id === imageId);
    if (selectedImage?.imagePath === coverImagePath) setCoverImagePath("");

    setColorVariants((prev) =>
      prev
        .map((variant) => {
          if (variant.id !== variantId) return variant;
          const item = variant.images.find((image) => image.id === imageId);
          if (item?.preview) URL.revokeObjectURL(item.preview);
          if (item?.imagePath && !savedImages.has(item.imagePath)) {
            void deleteOrphanUploadAction(item.imagePath);
          }
          return {
            ...variant,
            images: variant.images.filter((image) => image.id !== imageId),
          };
        })
    );
  }

  function reorderColorVariantImage(
    variantId: string,
    fromImageId: string,
    toImageId: string
  ) {
    setColorVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const fromIndex = variant.images.findIndex((image) => image.id === fromImageId);
        const toIndex = variant.images.findIndex((image) => image.id === toImageId);
        return {
          ...variant,
          images: moveArrayItem(variant.images, fromIndex, toIndex),
        };
      })
    );
  }

  function reorderColorVariant(fromVariantId: string, toVariantId: string) {
    setColorVariants((prev) => {
      const fromIndex = prev.findIndex((variant) => variant.id === fromVariantId);
      const toIndex = prev.findIndex((variant) => variant.id === toVariantId);
      return moveArrayItem(prev, fromIndex, toIndex);
    });
  }

  function onColorVariantDragStart(e: React.DragEvent, variantId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/x-lot9-color-variant",
      JSON.stringify({ variantId })
    );
  }

  function onColorVariantDrop(e: React.DragEvent, targetVariantId: string) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-lot9-color-variant");
    if (!raw) return;
    try {
      const source = JSON.parse(raw) as { variantId?: string };
      if (!source.variantId || source.variantId === targetVariantId) return;
      reorderColorVariant(source.variantId, targetVariantId);
    } catch {
      return;
    }
  }

  function onColorVariantImageDragStart(
    e: React.DragEvent,
    variantId: string,
    imageId: string
  ) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/x-lot9-color-image",
      JSON.stringify({ variantId, imageId })
    );
  }

  function onColorVariantImageDrop(
    e: React.DragEvent,
    targetVariantId: string,
    targetImageId: string
  ) {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/x-lot9-color-image");
    if (!raw) return;
    try {
      const source = JSON.parse(raw) as { variantId?: string; imageId?: string };
      if (source.variantId !== targetVariantId || !source.imageId) return;
      reorderColorVariantImage(targetVariantId, source.imageId, targetImageId);
    } catch {
      return;
    }
  }

  const formInner = (
    <form
      action={formAction}
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
      <input type="hidden" name="cover_image_path" value={coverImagePath} />

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

      {!usesColorVariants ? (
        <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
          <div>
            <Label className="text-base">Imágenes del producto</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Producto sin variantes de color: galería y stock global por talla.
              Puedes elegir varias fotos a la vez. Para varios colores con fotos
              distintas, usa &quot;Añadir colores&quot; más abajo.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={onPickFile}
          />

          <Button
            type="button"
            variant="secondary"
            disabled={imgPending || pending}
            onClick={() => fileRef.current?.click()}
          >
            {imgPending
              ? "Subiendo…"
              : productId != null
                ? "Subir imágenes"
                : "Añadir imágenes"}
          </Button>

          {imagePaths.length > 0 || uploadingImages.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePaths.map((src) => (
                <li
                  key={src}
                  className="relative aspect-square rounded-lg border bg-background overflow-hidden"
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
                    className="absolute top-1 right-1 rounded-md bg-black/70 text-white text-xs px-2 py-1 hover:bg-black"
                    disabled={imgPending || pending}
                    onClick={() => removeImage(src)}
                  >
                    Quitar
                  </button>
                  <label className="absolute left-1 bottom-1 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-black shadow-sm">
                    <input
                      type="radio"
                      name="cover_image_picker"
                      checked={effectiveCoverImagePath === src}
                      onChange={() => setCoverImagePath(src)}
                    />
                    Portada
                  </label>
                  <input type="hidden" name="images" value={src} />
                </li>
              ))}
              {uploadingImages.map((image) => (
                <li
                  key={image.id}
                  className="relative aspect-square rounded-lg border bg-background overflow-hidden"
                >
                  <Image
                    src={image.preview}
                    alt=""
                    fill
                    className="object-contain p-1 opacity-70"
                    sizes="200px"
                    unoptimized
                  />
                  <span className="absolute inset-x-2 bottom-2 rounded bg-black/70 px-2 py-1 text-center text-xs text-white">
                    Subiendo...
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay imágenes.</p>
          )}

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm">Filtros del catálogo</Label>
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
        </div>
      ) : (
        sortColorFiltersSelected(selectedColors).map((c) => (
          <input key={c} type="hidden" name="color_filters" value={c} />
        ))
      )}

      <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
        <div>
          <Label className="text-base">Colores del modelo</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Cada color es una opción en la tienda: al elegirla se muestran sus
            fotos (grande y miniaturas) y el stock por talla. Las imágenes se
            guardan en Cloudinary. La primera imagen del primer color es la
            portada en el catálogo.
          </p>
          <datalist id="suggested-color-names">
            {SUGGESTED_COLOR_NAMES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
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

        {!usesColorVariants && sortSizesSelected(selectedSizes).length > 0 ? (
          <div className="space-y-2 rounded-lg border bg-background p-3">
            <Label className="text-sm">Stock por talla (producto sin colores)</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sortSizesSelected(selectedSizes).map((size) => (
                <div key={size} className="space-y-1.5">
                  <Label htmlFor={`stock_${size}`} className="text-xs">
                    Stock {size}
                  </Label>
                  <Input
                    id={`stock_${size}`}
                    name={`stock_${size}`}
                    type="number"
                    min="0"
                    value={String(stockBySize[size] ?? 0)}
                    onChange={(e) =>
                      setStockBySize((prev) => ({
                        ...prev,
                        [size]: Math.max(
                          0,
                          Math.floor(Number(e.target.value) || 0)
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <input
          ref={colorVariantFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={onPickColorVariantFile}
        />

        <Button
          type="button"
          variant="secondary"
          disabled={imgPending || pending}
          onClick={addColorVariant}
        >
          {imgPending
            ? "Subiendo…"
            : "Añadir colores"}
        </Button>

        {colorVariants.length > 0 ? (
          <ul className="space-y-4">
            {colorVariants.map((variant, variantIndex) => (
              <li
                key={variant.id}
                onDragOver={(e) => {
                  if (
                    e.dataTransfer.types.includes(
                      "application/x-lot9-color-variant"
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => onColorVariantDrop(e, variant.id)}
                className="space-y-3 rounded-lg border bg-background p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => onColorVariantDragStart(e, variant.id)}
                      className="inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md border bg-muted/60 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                      aria-label={`Arrastrar ${variant.label || `color ${variantIndex + 1}`}`}
                      title="Arrastrar color"
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </button>

                    <Input
                      value={variant.label}
                      onChange={(e) =>
                        updateColorVariantLabel(variant.id, e.target.value)
                      }
                      placeholder="Nombre del color"
                      list="suggested-color-names"
                      className="h-9 sm:max-w-xs"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={imgPending || pending}
                      onClick={() => pickColorVariantImage(variant.id)}
                    >
                      Subir fotos
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
                        draggable
                        onDragStart={(e) =>
                          onColorVariantImageDragStart(e, variant.id, image.id)
                        }
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) =>
                          onColorVariantImageDrop(e, variant.id, image.id)
                        }
                        className="relative aspect-square cursor-move overflow-hidden rounded-md border bg-muted"
                      >
                        {src ? (
                          <AdminPreviewImage
                            src={image.preview ?? src}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="160px"
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
                        <label className="absolute left-1 bottom-1 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-black shadow-sm">
                          <input
                            type="radio"
                            name="cover_image_picker"
                            checked={effectiveCoverImagePath === image.imagePath}
                            onChange={() => setCoverImagePath(image.imagePath)}
                            disabled={!image.imagePath}
                          />
                          Portada
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {variant.images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sube una o varias imágenes para este color.
                  </p>
                ) : null}

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

      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || imgPending}>
          {pending
            ? "Guardando…"
            : "Guardar"}
        </Button>
      </div>
    </form>
  );

  if (!showLivePreview) {
    return formInner;
  }

  return (
    <div className="grid w-full gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,420px)] items-start">
      <div className="min-w-0">{formInner}</div>

      <AdminStorefrontPreview
        name={name}
        price={previewPrice}
        images={previewImages}
        coverImage={effectiveCoverImagePath}
        variantLabel={variantLabelForSubmit}
        description={description}
        sizes={previewSizes}
        stockBySize={previewStockBySize}
        colorVariants={colorVariants.map((variant) => ({
          label: variant.label,
          images: variant.images
            .map((image) => image.preview ?? image.imagePath)
            .filter(Boolean),
          stockBySize: variant.stockBySize,
        }))}
        isPublished={isPublished}
      />
    </div>
  );
}
