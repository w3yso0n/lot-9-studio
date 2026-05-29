"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { useState } from "react";

type Props = {
  imageUrl: string;
  cropX: number;
  cropY: number;
  cropZoom: number;
  onCropChange: (cropX: number, cropY: number, cropZoom: number) => void;
  onReset: () => void;
};

export function HeroCropTool({
  imageUrl,
  cropX,
  cropY,
  cropZoom,
  onCropChange,
  onReset,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(cropZoom);

  const handleCropChange = (location: Point) => {
    setCrop(location);
  };

  const handleCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    // Usar el cambio de crop para actualizar la posición
    // croppedArea tiene valores normalizados entre 0 y 1
    const centerX = (croppedArea.x + croppedArea.width / 2) * 100;
    const centerY = (croppedArea.y + croppedArea.height / 2) * 100;
    
    onCropChange(
      Math.min(100, Math.max(0, centerX)),
      Math.min(100, Math.max(0, centerY)),
      zoom
    );
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    onCropChange(cropX, cropY, newZoom);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onReset();
  };

  if (!imageUrl) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Sube una imagen para usar la herramienta de recorte.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Herramienta de recorte visual</p>
          <p className="text-xs text-muted-foreground">
            Recorta la imagen para obtener el mejor resultado en horizontal (16:9).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-none w-full sm:w-auto"
          onClick={handleReset}
        >
          Centrar recorte
        </Button>
      </div>

      {/* Cropper */}
      <div className="relative h-96 overflow-hidden border bg-neutral-100">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={21 / 9}
          cropShape="rect"
          showGrid={true}
          restrictPosition={false}
          onCropChange={handleCropChange}
          onCropComplete={handleCropComplete}
          onZoomChange={handleZoomChange}
        />
      </div>

      {/* Zoom slider */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_130px] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="crop-zoom-slider">Zoom</Label>
          <input
            id="crop-zoom-slider"
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-black"
          />
          <p className="text-xs text-muted-foreground">
            Zoom: {zoom.toFixed(2)}x
          </p>
        </div>
      </div>

      {/* Preview de aspecto 16:9 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Vista previa horizontal (16:9)</p>
        <div className="relative aspect-video overflow-hidden border bg-neutral-100">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${cropX}% ${cropY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${cropX}% ${cropY}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Preview de aspecto 4:5 (mobile) */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Vista previa mobile (4:5)</p>
        <div className="relative aspect-[4/5] overflow-hidden border bg-neutral-100 mx-auto w-40">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${cropX}% ${cropY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${cropX}% ${cropY}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
