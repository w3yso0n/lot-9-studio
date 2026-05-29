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
import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Layers,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useActionState, useMemo, useState, useTransition } from "react";

type CarouselImage = { url: string; alt?: string; link?: string };
type DraftSection = HomeSection & { localId: string };

const SECTION_LABELS: Record<HomeSectionType, string> = {
  hero: "Hero",
  banner: "Imagen / Banner",
  carousel: "Carrusel",
  video: "Video",
  new_drops: "New Drops",
  catalog: "Catalogo",
  text: "Texto / Separador",
};

const SECTION_TYPES = Object.keys(SECTION_LABELS) as HomeSectionType[];

function makeDraft(section: HomeSection): DraftSection {
  return { ...section, localId: `saved-${section.id}` };
}

function newSection(type: HomeSectionType, sortOrder = 0): DraftSection {
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
    sortOrder,
    isEnabled: true,
  };
}

function cloneContent(content: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
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

function imagesContent(section: DraftSection): CarouselImage[] {
  const value = section.content.images;
  return Array.isArray(value)
    ? value.filter(
        (item): item is CarouselImage =>
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

function previewLabel(section: DraftSection): string {
  if (section.type === "hero") return "Portada";
  if (section.type === "banner") return "Banner";
  if (section.type === "new_drops") return "New Drops";
  if (section.type === "catalog") return "Catalogo";
  if (section.type === "text") return "Texto";
  return SECTION_LABELS[section.type];
}

function previewMeta(section: DraftSection): string {
  if (section.type !== "carousel") return "";
  const count = imagesContent(section).length;
  return `${count} ${count === 1 ? "imagen" : "imagenes"}`;
}

function summaryText(section: DraftSection): string {
  if (section.type === "carousel") {
    const count = imagesContent(section).length;
    return `${count} ${count === 1 ? "imagen" : "imagenes"}`;
  }
  if (section.type === "catalog") {
    return `${numberContent(section, "limit", 8)} productos`;
  }
  if (section.type === "video") {
    return stringContent(section, "url") ? "Video configurado" : "Sin video";
  }
  if (section.type === "new_drops") return "Carrusel de New Drops";
  return section.subtitle || "Sin resumen";
}

function displayUrl(url: string): string {
  if (url.length <= 34) return url;
  return `${url.slice(0, 18)}...${url.slice(-12)}`;
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
    const hasHero = mapped.some((section) => section.type === "hero");

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newBlockType, setNewBlockType] = useState<HomeSectionType>("banner");
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const saving = pending || uploading;

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

  function expand(localId: string, force = true) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (force) next.add(localId);
      else next.delete(localId);
      return next;
    });
  }

  function toggleExpanded(localId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(localId)) next.delete(localId);
      else next.add(localId);
      return next;
    });
  }

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

  function addSection(type: HomeSectionType) {
    const draft = newSection(type, sections.length);
    setSections((prev) => [...prev, draft]);
    expand(draft.localId);
  }

  function addBaseStructure() {
    const drafts: DraftSection[] = [
      {
        ...newSection("hero", 0),
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
      { ...newSection("new_drops", 1), title: "New Drops" },
      { ...newSection("catalog", 2), title: "Catalogo", content: { limit: 8, showMore: true } },
      {
        ...newSection("video", 3),
        title: "Video destacado",
        content: { url: homeSettings.featuredVideoUrl, layout: "stacked" },
      },
    ];
    setSections(drafts);
    setExpandedIds(new Set(drafts.map((draft) => draft.localId)));
  }

  function moveSection(from: number, to: number) {
    setSections((prev) => moveItem(prev, from, to));
  }

  function moveSectionTo(localId: string, position: number) {
    setSections((prev) => {
      const from = prev.findIndex((section) => section.localId === localId);
      return moveItem(prev, from, position - 1);
    });
  }

  function duplicateSection(section: DraftSection) {
    const copy: DraftSection = {
      ...section,
      id: -Date.now(),
      localId: crypto.randomUUID(),
      title: `${section.title || SECTION_LABELS[section.type]} copia`,
      content: cloneContent(section.content),
      sortOrder: sections.length,
    };
    setSections((prev) => {
      const index = prev.findIndex((item) => item.localId === section.localId);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    expand(copy.localId);
  }

  function removeSection(section: DraftSection) {
    const label = section.title || SECTION_LABELS[section.type];
    if (!window.confirm(`Eliminar el bloque "${label}"? Esta accion se guarda al presionar Guardar cambios.`)) {
      return;
    }
    setSections((prev) => prev.filter((item) => item.localId !== section.localId));
  }

  function uploadAsset(
    localId: string,
    file: File,
    resourceType: "image" | "video",
    imageIndex?: number
  ) {
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
            const nextImages =
              imageIndex == null
                ? [...images, { url: result.url, alt: "", link: "" }]
                : images.map((image, index) =>
                    index === imageIndex ? { ...image, url: result.url! } : image
                  );
            return { ...section, content: { ...section.content, images: nextImages } };
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

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="sections" value={serialized} />

      <div className="sticky top-0 z-20 -mx-2 border-b bg-neutral-50/95 px-2 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 rounded-md border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-none bg-black text-white hover:bg-zinc-800"
            >
              {pending ? "Guardando..." : uploading ? "Subiendo..." : "Guardar cambios"}
            </Button>
            <select
              value={newBlockType}
              onChange={(event) => setNewBlockType(event.target.value as HomeSectionType)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Tipo de bloque a agregar"
            >
              {SECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SECTION_LABELS[type]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => addSection(newBlockType)}
            >
              <Plus className="mr-2 size-4" aria-hidden />
              Agregar bloque
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{sections.length} bloques</span>
            {state?.ok ? <span className="text-emerald-700">Cambios guardados</span> : null}
            {saving ? <span>Guardando cambios...</span> : null}
          </div>
        </div>
      </div>

      {state?.error || uploadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError ?? state?.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Cambios guardados. El home publico usara este orden.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-md border bg-white p-3">
        <Button
          type="button"
          className="rounded-none bg-black text-white hover:bg-zinc-800"
          onClick={addBaseStructure}
        >
          <Layers className="mr-2 size-4" aria-hidden />
          Crear estructura base
        </Button>
        {SECTION_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => addSection(type)}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            {SECTION_LABELS[type]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
            Agrega bloques para activar el constructor. Si no hay bloques, el home usa el diseno actual.
          </div>
        ) : null}

        {sections.map((section, index) => {
          const isExpanded = expandedIds.has(section.localId);
          return (
            <article
              key={section.localId}
              className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm"
            >
              <div className="grid gap-3 p-3 sm:grid-cols-[92px_minmax(0,1fr)]">
                <div className="flex items-start gap-3 sm:block">
                  <div className="mb-2 inline-flex h-6 min-w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-semibold text-neutral-700">
                    #{index + 1}
                  </div>
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 sm:h-20 sm:w-full">
                    {firstImage(section) ? (
                      <Image
                        src={firstImage(section)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized
                      />
                    ) : (
                      <SectionPreviewPlaceholder section={section} />
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                          {SECTION_LABELS[section.type]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            section.isEnabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {section.isEnabled ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <h2 className="mt-1 truncate text-base font-semibold">
                        {section.title || SECTION_LABELS[section.type]}
                      </h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {summaryText(section)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => moveSection(index, 0)}
                        disabled={index === 0}
                        title="Mover al inicio"
                      >
                        <ChevronsUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => moveSection(index, index - 1)}
                        disabled={index === 0}
                        title="Subir"
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => moveSection(index, index + 1)}
                        disabled={index === sections.length - 1}
                        title="Bajar"
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => moveSection(index, sections.length - 1)}
                        disabled={index === sections.length - 1}
                        title="Mover al final"
                      >
                        <ChevronsDown className="size-4" aria-hidden />
                      </Button>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Mover a
                        <select
                          value={index + 1}
                          onChange={(event) => moveSectionTo(section.localId, Number(event.target.value))}
                          className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
                        >
                          {sections.map((_, positionIndex) => (
                            <option key={positionIndex} value={positionIndex + 1}>
                              {positionIndex + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none"
                      onClick={() => toggleExpanded(section.localId)}
                    >
                      <Pencil className="mr-2 size-4" aria-hidden />
                      {isExpanded ? "Cerrar" : "Editar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none"
                      onClick={() =>
                        updateSection(section.localId, { isEnabled: !section.isEnabled })
                      }
                    >
                      {section.isEnabled ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none"
                      onClick={() => duplicateSection(section)}
                    >
                      <Copy className="mr-2 size-4" aria-hidden />
                      Duplicar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none text-red-600 hover:text-red-700"
                      onClick={() => removeSection(section)}
                    >
                      <Trash2 className="mr-2 size-4" aria-hidden />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t bg-neutral-50 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <select
                        value={section.type}
                        onChange={(event) =>
                          updateSection(section.localId, {
                            type: event.target.value as HomeSectionType,
                            content:
                              event.target.value === "catalog"
                                ? { limit: 8, showMore: true }
                                : event.target.value === "carousel"
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
                    <TextField
                      label="Titulo"
                      value={section.title}
                      onChange={(value) => updateSection(section.localId, { title: value })}
                    />
                    <div className="md:col-span-2">
                      <TextField
                        label="Subtitulo / texto corto"
                        value={section.subtitle}
                        onChange={(value) => updateSection(section.localId, { subtitle: value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-md border bg-white p-3">
                    <SectionFields
                      section={section}
                      updateContent={updateContent}
                      uploadAsset={uploadAsset}
                      uploading={uploading}
                    />
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-2 border-t bg-neutral-50/95 px-2 py-3 backdrop-blur">
        <div className="flex justify-end rounded-md border bg-white p-3 shadow-sm">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-none bg-black text-white hover:bg-zinc-800"
          >
            {pending ? "Guardando..." : uploading ? "Subiendo..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionPreviewPlaceholder({ section }: { section: DraftSection }) {
  const label = previewLabel(section);
  const meta = previewMeta(section);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-center">
      {section.type === "video" ? (
        <span className="flex size-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm">
          <Play className="ml-0.5 size-3" fill="currentColor" aria-hidden />
        </span>
      ) : null}
      <span className="max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
        {label}
      </span>
      {meta ? (
        <span className="text-[10px] font-medium text-neutral-400">{meta}</span>
      ) : null}
    </div>
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
  uploadAsset: (
    localId: string,
    file: File,
    resourceType: "image" | "video",
    imageIndex?: number
  ) => void;
  uploading: boolean;
}) {
  if (section.type === "hero") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Titulo hero" value={stringContent(section, "title")} onChange={(value) => updateContent(section.localId, "title", value)} />
        <TextField label="Subtitulo hero" value={stringContent(section, "subtitle")} onChange={(value) => updateContent(section.localId, "subtitle", value)} />
        <TextField label="Texto boton" value={stringContent(section, "buttonText")} onChange={(value) => updateContent(section.localId, "buttonText", value)} />
        <TextField label="Link boton" value={stringContent(section, "buttonHref")} onChange={(value) => updateContent(section.localId, "buttonHref", value)} />
        <UploadField label="Imagen hero" accept="image/jpeg,image/png,image/webp" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "image")} />
      </div>
    );
  }

  if (section.type === "banner") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Link opcional" value={stringContent(section, "link")} onChange={(value) => updateContent(section.localId, "link", value)} />
        <UploadField label="Imagen banner" accept="image/jpeg,image/png,image/webp" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "image")} />
      </div>
    );
  }

  if (section.type === "video") {
    const layout = stringContent(section, "layout") || "stacked";
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="URL video" value={stringContent(section, "url")} onChange={(value) => updateContent(section.localId, "url", value)} />
          <div className="space-y-1.5">
            <Label>Layout</Label>
            <select
              value={layout}
              onChange={(event) => updateContent(section.localId, "layout", event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="stacked">Vertical</option>
              <option value="side-left">Video a la izquierda</option>
              <option value="side-right">Video a la derecha</option>
            </select>
          </div>
        </div>
        <UploadField label="Subir video" accept="video/mp4,video/webm" disabled={uploading} onFile={(file) => uploadAsset(section.localId, file, "video")} />
        {layout !== "stacked" ? (
          <div className="space-y-1.5">
            <Label>Texto adicional</Label>
            <textarea
              value={stringContent(section, "textContent")}
              onChange={(event) => updateContent(section.localId, "textContent", event.target.value)}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Texto que aparecera al lado del video"
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (section.type === "catalog") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <NumberField label="Productos a mostrar" value={numberContent(section, "limit", 8)} onChange={(value) => updateContent(section.localId, "limit", value)} />
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={section.content.showMore !== false}
            onChange={(event) => updateContent(section.localId, "showMore", event.target.checked)}
            className="accent-black"
          />
          Mostrar boton Ver mas
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
          onChange={(event) => updateContent(section.localId, "text", event.target.value)}
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
        {images.length === 0 ? (
          <div className="rounded-md border border-dashed bg-neutral-50 p-5 text-center text-sm text-muted-foreground">
            Aun no hay imagenes en este carrusel.
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <CarouselImageCard
              key={`${image.url}-${index}`}
              image={image}
              index={index}
              total={images.length}
              disabled={uploading}
              onChange={(patch) =>
                updateContent(
                  section.localId,
                  "images",
                  images.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, ...patch } : item
                  )
                )
              }
              onUpload={(file) => uploadAsset(section.localId, file, "image", index)}
              onMove={(targetIndex) =>
                updateContent(section.localId, "images", moveItem(images, index, targetIndex))
              }
              onRemove={() =>
                updateContent(
                  section.localId,
                  "images",
                  images.filter((_, itemIndex) => itemIndex !== index)
                )
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Este bloque no necesita campos adicionales.
    </p>
  );
}

function CarouselImageCard({
  image,
  index,
  total,
  disabled,
  onChange,
  onUpload,
  onMove,
  onRemove,
}: {
  image: CarouselImage;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (patch: Partial<CarouselImage>) => void;
  onUpload: (file: File) => void;
  onMove: (targetIndex: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
          #{index + 1}
        </span>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Mover a
          <select
            value={index + 1}
            onChange={(event) => onMove(Number(event.target.value) - 1)}
            className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
          >
            {Array.from({ length: total }).map((_, positionIndex) => (
              <option key={positionIndex} value={positionIndex + 1}>
                {positionIndex + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="relative aspect-[4/3] bg-neutral-100">
        <Image src={image.url} alt="" fill className="object-cover" sizes="260px" unoptimized />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2 rounded-md bg-neutral-50 px-2 py-1 text-xs text-muted-foreground">
          <span className="min-w-0 truncate" title={image.url}>
            {displayUrl(image.url)}
          </span>
          <button
            type="button"
            className="shrink-0 text-neutral-700 hover:text-black"
            title="Copiar URL"
            onClick={() => void navigator.clipboard?.writeText(image.url)}
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
        <Input
          placeholder="Alt opcional"
          value={image.alt ?? ""}
          onChange={(event) => onChange({ alt: event.target.value })}
        />
        <Input
          placeholder="Link opcional"
          value={image.link ?? ""}
          onChange={(event) => onChange({ link: event.target.value })}
        />
        <UploadField
          label="Cambiar imagen"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onFile={onUpload}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() => onMove(index - 1)}
            disabled={index === 0}
          >
            <ArrowUp className="mr-1.5 size-3.5" aria-hidden />
            Subir
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() => onMove(index + 1)}
            disabled={index === total - 1}
          >
            <ArrowDown className="mr-1.5 size-3.5" aria-hidden />
            Bajar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none text-red-600 hover:text-red-700"
            onClick={onRemove}
          >
            Quitar
          </Button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min="1"
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
      />
    </div>
  );
}

function UploadField({
  label,
  accept,
  disabled,
  onFile,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
