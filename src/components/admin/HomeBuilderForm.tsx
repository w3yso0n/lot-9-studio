"use client";

import {
  saveHomeSectionsAction,
  uploadHomeSectionAssetAction,
  type SaveHomeSectionsState,
} from "@/app/admin/dashboard/home-builder/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeSection, HomeSectionType } from "@/lib/home-sections";
import type { HomeSettings } from "@/lib/home-settings";
import { GripVertical, ImageIcon, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useMemo, useState, useTransition } from "react";

type DraftSection = HomeSection & { localId: string };

const SECTION_LABELS: Record<HomeSectionType, string> = {
  hero: "Hero",
  banner: "Imagen / Banner",
  carousel: "Carrusel",
  video: "Video",
  new_drops: "New Drops",
  catalog: "Catálogo",
  text: "Texto / Separador",
};

const SECTION_TYPES = Object.keys(SECTION_LABELS) as HomeSectionType[];

function makeDraft(section: HomeSection): DraftSection {
  return { ...section, localId: `saved-${section.id}` };
}

function newSection(type: HomeSectionType): DraftSection {
  return {
    id: -Date.now(),
    localId: crypto.randomUUID(),
    type,
    title: SECTION_LABELS[type],
    subtitle: "",
    content:
      type === "catalog"
        ? { limit: 8, showMore: true }
        : type === "carousel"
          ? { images: [] }
          : {},
    sortOrder: 0,
    isEnabled: true,
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}

function stringContent(section: DraftSection, key: string): string {
  const value = section.content[key];
  return typeof value === "string" ? value : "";
}

function numberContent(section: DraftSection, key: string, fallback: number): number {
  const value = section.content[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function imagesContent(section: DraftSection): Array<{ url: string; alt?: string; link?: string }> {
  const value = section.content.images;
  return Array.isArray(value)
    ? value.filter(
        (item): item is { url: string; alt?: string; link?: string } =>
          typeof item === "object" &&
          item != null &&
          typeof (item as { url?: unknown }).url === "string"
      )
    : [];
}

function firstImage(section: DraftSection): string {
  if (section.type === "carousel") return imagesContent(section)[0]?.url ?? "";
  return stringContent(section, "imageUrl");
}

type Props = {
  initialSections: HomeSection[];
  homeSettings: HomeSettings;
};

export function HomeBuilderForm({ initialSections, homeSettings }: Props) {
  const [state, formAction, pending] = useActionState(
    saveHomeSectionsAction,
    null as SaveHomeSectionsState
  );
  const [sections, setSections] = useState<DraftSection[]>(() => {
    const mapped = initialSections.map(makeDraft);
    
    // Si no hay sección hero, crear una prellenada con Home Settings
    const hasHero = mapped.some((s) => s.type === "hero");
    if (!hasHero) {
      return [
        {
          id: -Date.now(),
          localId: crypto.randomUUID(),
          type: "hero",
          title: homeSettings.heroTitle,
          subtitle: homeSettings.heroSubtitle,
          content: {
            imageUrl: homeSettings.heroImageUrl,
            title: homeSettings.heroTitle,
            subtitle: homeSettings.heroSubtitle,
            buttonText: homeSettings.heroButtonText,
            buttonHref: homeSettings.heroButtonHref,
            crop: {
              x: homeSettings.heroCropX,
              y: homeSettings.heroCropY,
              zoom: homeSettings.heroCropZoom,
            },
          },
          sortOrder: 0,
          isEnabled: true,
        },
        ...mapped,
      ];
    }
    return mapped;
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const serialized = useMemo(
    () =>
      JSON.stringify(
        sections.map((section, index) => ({
          id: section.id > 0 ? section.id : undefined,
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          sortOrder: index,
          isEnabled: section.isEnabled,
        }))
      ),
    [sections]
  );

  function updateSection(localId: string, patch: Partial<DraftSection>) {
    setSections((prev) =>
      prev.map((section) =>
        section.localId === localId ? { ...section, ...patch } : section
      )
    );
  }

  function updateContent(localId: string, key: string, value: unknown) {
    setSections((prev) =>
      prev.map((section) =>
        section.localId === localId
          ? { ...section, content: { ...section.content, [key]: value } }
          : section
      )
    );
  }

  function uploadAsset(localId: string, file: File, resourceType: "image" | "video", imageIndex?: number) {
    setUploadError(null);
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("resource_type", resourceType);
      const result = await uploadHomeSectionAssetAction(fd);
      if (result.error || !result.url) {
        setUploadError(result.error ?? "No se pudo subir el archivo.");
        return;
      }
      setSections((prev) =>
        prev.map((section) => {
          if (section.localId !== localId) return section;
          if (section.type === "carousel") {
            const images = imagesContent(section);
            if (imageIndex == null) {
              return {
                ...section,
                content: {
                  ...section.content,
                  images: [...images, { url: result.url, alt: "", link: "" }],
                },
              };
            }
            return {
              ...section,
              content: {
                ...section.content,
                images: images.map((image, index) =>
                  index === imageIndex ? { ...image, url: result.url! } : image
                ),
              },
            };
          }
          return {
            ...section,
            content: {
              ...section.content,
              [resourceType === "video" ? "url" : "imageUrl"]: result.url,
            },
          };
        })
      );
    });
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setSections((prev) => {
      const from = prev.findIndex((section) => section.localId === dragId);
      const to = prev.findIndex((section) => section.localId === targetId);
      if (from < 0 || to < 0) return prev;
      return moveItem(prev, from, to);
    });
    setDragId(null);
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="sections" value={serialized} />

      {state?.error || uploadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError ?? state?.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Orden del home guardado.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-md border bg-white p-3">
        <Button
          type="button"
          className="rounded-none bg-black text-white hover:bg-zinc-800"
          onClick={() =>
            setSections([
              {
                ...newSection("hero"),
                title: "Hero principal",
                content: {
                  imageUrl: homeSettings.heroImageUrl,
                  title: homeSettings.heroTitle,
                  subtitle: homeSettings.heroSubtitle,
                  buttonText: homeSettings.heroButtonText,
                  buttonHref: homeSettings.heroButtonHref,
                  crop: {
                    x: homeSettings.heroCropX,
                    y: homeSettings.heroCropY,
                    zoom: homeSettings.heroCropZoom,
                  },
                },
              },
              { ...newSection("new_drops"), title: "New Drops" },
              { ...newSection("catalog"), title: "Catálogo", content: { limit: 8, showMore: true } },
              { ...newSection("video"), title: "Video destacado", content: { url: homeSettings.featuredVideoUrl, size: "compact" } },
            ])
          }
        >
          Crear estructura base
        </Button>
        {SECTION_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => setSections((prev) => [...prev, newSection(type)])}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            {SECTION_LABELS[type]}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
            Agrega bloques para activar el constructor. Si no hay bloques, el home usa el diseño actual.
          </div>
        ) : null}

        {sections.map((section) => (
          <article
            key={section.localId}
            draggable
            onDragStart={() => setDragId(section.localId)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(section.localId)}
            className="grid gap-4 rounded-md border bg-white p-4 md:grid-cols-[44px_140px_minmax(0,1fr)]"
          >
            <button
              type="button"
              className="flex h-10 w-10 cursor-grab items-center justify-center border text-muted-foreground"
              title="Arrastrar"
            >
              <GripVertical className="size-4" aria-hidden />
            </button>

            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
              {firstImage(section) ? (
                <Image
                  src={firstImage(section)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="140px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-6" aria-hidden />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <select
                      value={section.type}
                      onChange={(e) =>
                        updateSection(section.localId, {
                          type: e.target.value as HomeSectionType,
                          content:
                            e.target.value === "catalog"
                              ? { limit: 8, showMore: true }
                              : e.target.value === "carousel"
                                ? { images: [] }
                                : {},
                        })
                      }
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {SECTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {SECTION_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Título</Label>
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section.localId, { title: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={section.isEnabled}
                      onChange={(e) =>
                        updateSection(section.localId, {
                          isEnabled: e.target.checked,
                        })
                      }
                      className="accent-black"
                    />
                    Activo
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none text-red-600"
                    onClick={() =>
                      setSections((prev) =>
                        prev.filter((item) => item.localId !== section.localId)
                      )
                    }
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden />
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Subtítulo / texto corto</Label>
                <Input
                  value={section.subtitle}
                  onChange={(e) =>
                    updateSection(section.localId, { subtitle: e.target.value })
                  }
                />
              </div>

              <SectionFields
                section={section}
                updateContent={updateContent}
                uploadAsset={uploadAsset}
                uploading={uploading}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-end border-t pt-5">
        <Button
          type="submit"
          disabled={pending || uploading}
          className="rounded-none bg-black text-white hover:bg-zinc-800"
        >
          {pending ? "Guardando..." : uploading ? "Subiendo..." : "Guardar orden del home"}
        </Button>
      </div>
    </form>
  );
}

function SectionFields({
  section,
  updateContent,
  uploadAsset,
  uploading,
}: {
  section: DraftSection;
  updateContent: (localId: string, key: string, value: unknown) => void;
  uploadAsset: (localId: string, file: File, resourceType: "image" | "video", imageIndex?: number) => void;
  uploading: boolean;
}) {
  if (section.type === "hero") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Título hero" value={stringContent(section, "title")} onChange={(v) => updateContent(section.localId, "title", v)} />
        <TextField label="Subtítulo hero" value={stringContent(section, "subtitle")} onChange={(v) => updateContent(section.localId, "subtitle", v)} />
        <TextField label="Texto botón" value={stringContent(section, "buttonText")} onChange={(v) => updateContent(section.localId, "buttonText", v)} />
        <TextField label="Link botón" value={stringContent(section, "buttonHref")} onChange={(v) => updateContent(section.localId, "buttonHref", v)} />
        <UploadField label="Imagen hero" accept="image/jpeg,image/png,image/webp" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "image")} />
      </div>
    );
  }

  if (section.type === "banner") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Link opcional" value={stringContent(section, "link")} onChange={(v) => updateContent(section.localId, "link", v)} />
        <UploadField label="Imagen banner" accept="image/jpeg,image/png,image/webp" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "image")} />
      </div>
    );
  }

  if (section.type === "video") {
    const layout = stringContent(section, "layout") || "stacked";
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="URL video" value={stringContent(section, "url")} onChange={(v) => updateContent(section.localId, "url", v)} />
          <select
            value={layout}
            onChange={(e) => updateContent(section.localId, "layout", e.target.value)}
            className="h-9 self-end rounded-md border bg-background px-3 text-sm"
          >
            <option value="stacked">Vertical</option>
            <option value="side-left">Video a la izquierda</option>
            <option value="side-right">Video a la derecha</option>
          </select>
        </div>
        <UploadField label="Subir video" accept="video/mp4,video/webm" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "video")} />
        {layout !== "stacked" && (
          <div className="space-y-1.5">
            <Label>Texto adicional</Label>
            <textarea
              value={stringContent(section, "textContent")}
              onChange={(e) => updateContent(section.localId, "textContent", e.target.value)}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Texto que aparecerá al lado del video"
            />
          </div>
        )}
      </div>
    );
  }

  if (section.type === "catalog") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Productos a mostrar" value={numberContent(section, "limit", 8)} onChange={(v) => updateContent(section.localId, "limit", v)} />
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={section.content.showMore !== false}
            onChange={(e) => updateContent(section.localId, "showMore", e.target.checked)}
            className="accent-black"
          />
          Mostrar botón Ver más
        </label>
      </div>
    );
  }

  if (section.type === "text") {
    return (
      <div className="space-y-1.5">
        <Label>Texto</Label>
        <textarea
          value={stringContent(section, "text")}
          onChange={(e) => updateContent(section.localId, "text", e.target.value)}
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
    );
  }

  if (section.type === "carousel") {
    const images = imagesContent(section);
    return (
      <div className="space-y-3">
        <UploadField label="Agregar imagen al carrusel" accept="image/jpeg,image/png,image/webp" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "image")} />
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="space-y-2 border p-3">
              <div className="relative aspect-video bg-neutral-100">
                <Image src={image.url} alt="" fill className="object-cover" sizes="240px" unoptimized />
              </div>
              <Input
                placeholder="Alt"
                value={image.alt ?? ""}
                onChange={(e) =>
                  updateContent(section.localId, "images", images.map((item, i) => i === index ? { ...item, alt: e.target.value } : item))
                }
              />
              <Input
                placeholder="Link opcional"
                value={image.link ?? ""}
                onChange={(e) =>
                  updateContent(section.localId, "images", images.map((item, i) => i === index ? { ...item, link: e.target.value } : item))
                }
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="rounded-none" onClick={() => updateContent(section.localId, "images", moveItem(images, index, Math.max(0, index - 1)))}>
                  Subir
                </Button>
                <Button type="button" variant="outline" className="rounded-none" onClick={() => updateContent(section.localId, "images", moveItem(images, index, Math.min(images.length - 1, index + 1)))}>
                  Bajar
                </Button>
                <Button type="button" variant="outline" className="rounded-none text-red-600" onClick={() => updateContent(section.localId, "images", images.filter((_, i) => i !== index))}>
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" min="1" value={value} onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))} />
    </div>
  );
}

function UploadField({ label, accept, disabled, onFile }: { label: string; accept: string; disabled: boolean; onFile: (file: File) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
