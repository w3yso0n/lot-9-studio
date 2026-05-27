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
import { useActionState, useState } from "react";

type Props = {
  initial: HomeSettings;
};

function encodePublicMediaPath(path: string): string {
  const value = path.trim();
  if (/^https?:\/\//i.test(value)) return value;
  const parts = value.split("/").filter(Boolean);
  if (parts.length === 0) return value;
  return "/" + parts.map(encodeURIComponent).join("/");
}

export function HomeSettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    saveHomeSettingsAction,
    null as SaveHomeSettingsState
  );
  const [isHeroEnabled, setIsHeroEnabled] = useState(initial.isHeroEnabled);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initial.isVideoEnabled);
  const [videoUrl, setVideoUrl] = useState(initial.featuredVideoUrl);

  const heroImage = encodePublicMediaPath(initial.heroImageUrl);
  const featuredVideo = encodePublicMediaPath(videoUrl || initial.featuredVideoUrl);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Configuración guardada.
        </p>
      ) : null}

      <input
        type="hidden"
        name="current_hero_image_url"
        value={initial.heroImageUrl}
      />
      <input
        type="hidden"
        name="current_featured_video_url"
        value={initial.featuredVideoUrl}
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

      <Card>
        <CardHeader>
          <CardTitle>Portada / hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isHeroEnabled}
              onChange={(e) => setIsHeroEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar portada en el home
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hero_title">Título principal</Label>
              <textarea
                id="hero_title"
                name="hero_title"
                rows={5}
                defaultValue={initial.heroTitle}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Subtítulo</Label>
              <Input
                id="hero_subtitle"
                name="hero_subtitle"
                defaultValue={initial.heroSubtitle}
              />

              <Label htmlFor="hero_button_text" className="pt-3">
                Texto del botón
              </Label>
              <Input
                id="hero_button_text"
                name="hero_button_text"
                defaultValue={initial.heroButtonText}
              />

              <Label htmlFor="hero_button_href" className="pt-3">
                Link del botón
              </Label>
              <Input
                id="hero_button_href"
                name="hero_button_href"
                defaultValue={initial.heroButtonHref}
                placeholder="#catalogo"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="240px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_image_file">Imagen de portada</Label>
              <Input
                id="hero_image_file"
                name="hero_image_file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
              <p className="text-xs text-muted-foreground">
                Si no eliges una nueva imagen, se conserva la actual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video destacado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isVideoEnabled}
              onChange={(e) => setIsVideoEnabled(e.target.checked)}
              className="h-4 w-4"
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

          <div className="space-y-2">
            <Label htmlFor="featured_video_file">Subir nuevo video</Label>
            <Input
              id="featured_video_file"
              name="featured_video_file"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
            />
            <p className="text-xs text-muted-foreground">
              Si subes un archivo, reemplaza la URL al guardar. Máximo 45 MB.
            </p>
          </div>

          {featuredVideo ? (
            <div className="overflow-hidden rounded-lg border bg-black">
              <video
                src={featuredVideo}
                controls
                muted
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}
