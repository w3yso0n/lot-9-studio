"use client";

import {
  saveHomeSettingsAction,
  type SaveHomeSettingsState,
} from "@/app/admin/dashboard/home-settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeSettings } from "@/lib/home-settings";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

type Props = {
  initial: HomeSettings;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;

function encodePublicMediaPath(path: string): string {
  const value = path.trim();
  if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) return value;
  const parts = value.split("/").filter(Boolean);
  if (parts.length === 0) return value;
  return "/" + parts.map(encodeURIComponent).join("/");
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizedTitle(value: string): string {
  return value.replace(/\\n/g, "\n");
}

export function HomeSettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    saveHomeSettingsAction,
    null as SaveHomeSettingsState
  );
  const [active, setActive] = useState(initial);
  const [isHeroEnabled, setIsHeroEnabled] = useState(initial.isHeroEnabled);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initial.isVideoEnabled);
  const [heroTitle, setHeroTitle] = useState(normalizedTitle(initial.heroTitle));
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle);
  const [heroButtonText, setHeroButtonText] = useState(initial.heroButtonText);
  const [heroButtonHref, setHeroButtonHref] = useState(initial.heroButtonHref);
  const [videoUrl, setVideoUrl] = useState(initial.featuredVideoUrl);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const activeHeroImage = encodePublicMediaPath(active.heroImageUrl);
  const activeVideo = encodePublicMediaPath(active.featuredVideoUrl);
  const previewHeroImage = heroPreview ?? activeHeroImage;
  const previewVideo = videoPreview ?? encodePublicMediaPath(videoUrl || active.featuredVideoUrl);

  useEffect(() => {
    if (!state?.ok || !state.settings) return;
    setActive(state.settings);
    setIsHeroEnabled(state.settings.isHeroEnabled);
    setIsVideoEnabled(state.settings.isVideoEnabled);
    setHeroTitle(normalizedTitle(state.settings.heroTitle));
    setHeroSubtitle(state.settings.heroSubtitle);
    setHeroButtonText(state.settings.heroButtonText);
    setHeroButtonHref(state.settings.heroButtonHref);
    setVideoUrl(state.settings.featuredVideoUrl);
    clearHeroFile();
    clearVideoFile();
  }, [state]);

  useEffect(() => {
    return () => {
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [heroPreview, videoPreview]);

  function clearHeroFile() {
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroPreview(null);
    if (heroFileRef.current) heroFileRef.current.value = "";
  }

  function clearVideoFile() {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    if (videoFileRef.current) videoFileRef.current.value = "";
  }

  function resetToActive() {
    setClientError(null);
    setIsHeroEnabled(active.isHeroEnabled);
    setIsVideoEnabled(active.isVideoEnabled);
    setHeroTitle(normalizedTitle(active.heroTitle));
    setHeroSubtitle(active.heroSubtitle);
    setHeroButtonText(active.heroButtonText);
    setHeroButtonHref(active.heroButtonHref);
    setVideoUrl(active.featuredVideoUrl);
    clearHeroFile();
    clearVideoFile();
  }

  function onHeroFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = e.target.files?.[0];
    if (!file) {
      clearHeroFile();
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setClientError("Formato de imagen no permitido. Usa JPG, PNG o WebP.");
      clearHeroFile();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setClientError(`La imagen supera el limite de ${formatBytes(MAX_IMAGE_BYTES)}.`);
      clearHeroFile();
      return;
    }
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroPreview(URL.createObjectURL(file));
  }

  function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = e.target.files?.[0];
    if (!file) {
      clearVideoFile();
      return;
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      setClientError("Formato de video no permitido. Usa MP4 o WebM.");
      clearVideoFile();
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setClientError(`El video supera el limite de ${formatBytes(MAX_VIDEO_BYTES)}.`);
      clearVideoFile();
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error || clientError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {clientError ?? state?.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Configuración guardada. El home ya fue revalidado.
        </p>
      ) : null}

      <input type="hidden" name="current_hero_image_url" value={active.heroImageUrl} />
      <input
        type="hidden"
        name="current_featured_video_url"
        value={active.featuredVideoUrl}
      />
      <input
        type="hidden"
        name="is_hero_enabled"
        value={isHeroEnabled ? "true" : "false"}
      />
      <input
        type="hidden"
        name="is_video_enabled"
        value={isVideoEnabled ? "true" : "false"}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Portada / Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isHeroEnabled}
                  onChange={(e) => setIsHeroEnabled(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                Mostrar portada en el home
              </label>

              <div className="space-y-2">
                <Label htmlFor="hero_title">Titulo principal</Label>
                <textarea
                  id="hero_title"
                  name="hero_title"
                  rows={4}
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(normalizedTitle(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Puedes escribir saltos de linea reales o usar \n.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Subtitulo</Label>
                  <Input
                    id="hero_subtitle"
                    name="hero_subtitle"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_button_text">Texto del boton</Label>
                  <Input
                    id="hero_button_text"
                    name="hero_button_text"
                    value={heroButtonText}
                    onChange={(e) => setHeroButtonText(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_button_href">Link del boton</Label>
                <Input
                  id="hero_button_href"
                  name="hero_button_href"
                  value={heroButtonHref}
                  onChange={(e) => setHeroButtonHref(e.target.value)}
                  placeholder="/products#catalogo"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagen del Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative aspect-[4/3] overflow-hidden border bg-muted">
                  {previewHeroImage ? (
                    <Image
                      src={previewHeroImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="220px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hero_image_file">Subir imagen</Label>
                    <Input
                      ref={heroFileRef}
                      id="hero_image_file"
                      name="hero_image_file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onHeroFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG o WebP. Maximo {formatBytes(MAX_IMAGE_BYTES)}.
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/20 p-3 text-xs">
                    <p className="font-medium">Archivo activo</p>
                    <p className="mt-1 break-all text-muted-foreground">
                      {active.heroImageUrl || "Sin archivo activo"}
                    </p>
                  </div>

                  {heroPreview ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none"
                      onClick={clearHeroFile}
                    >
                      Quitar imagen nueva
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Video destacado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isVideoEnabled}
                  onChange={(e) => setIsVideoEnabled(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                Mostrar video destacado
              </label>

              <div className="space-y-2">
                <Label htmlFor="featured_video_url">URL del video</Label>
                <Input
                  id="featured_video_url"
                  name="featured_video_url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="/video1.mp4 o https://..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="featured_video_file">Subir nuevo video</Label>
                  <Input
                    ref={videoFileRef}
                    id="featured_video_file"
                    name="featured_video_file"
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={onVideoFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    MP4 o WebM. Maximo {formatBytes(MAX_VIDEO_BYTES)}.
                  </p>
                </div>

                {videoPreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    onClick={clearVideoFile}
                  >
                    Quitar video nuevo
                  </Button>
                ) : null}
              </div>

              <div className="rounded-md border bg-muted/20 p-3 text-xs">
                <p className="font-medium">Video activo</p>
                <p className="mt-1 break-all text-muted-foreground">
                  {active.featuredVideoUrl || "Sin video activo"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vista previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Hero
                </p>
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  {previewHeroImage ? (
                    <Image
                      src={previewHeroImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="360px"
                      unoptimized
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-white">
                    <h2 className="whitespace-pre-line text-3xl font-bold leading-none">
                      {heroTitle || "NO TODOS\nLO ENTENDERÁN"}
                    </h2>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em]">
                      {heroSubtitle || "LOT9_STUDIO_GUADALAJARA"}
                    </p>
                    <span className="mt-4 inline-flex bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black">
                      {heroButtonText || "Descubre la colección"}
                    </span>
                  </div>
                </div>
              </div>

              {previewVideo ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Video
                  </p>
                  <div className="overflow-hidden bg-black">
                    <video
                      src={previewVideo}
                      controls
                      muted
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Button asChild type="button" variant="outline" className="rounded-none">
            <Link href="/" target="_blank">
              Ver home
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={resetToActive}
            disabled={pending}
          >
            Restaurar valores actuales
          </Button>
        </div>

        <Button
          type="submit"
          disabled={pending || Boolean(clientError)}
          className="rounded-none bg-black text-white hover:bg-zinc-800"
        >
          {pending
            ? heroPreview || videoPreview
              ? "Subiendo..."
              : "Guardando..."
            : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
