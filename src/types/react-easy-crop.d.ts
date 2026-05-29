declare module "react-easy-crop" {
  import type { ComponentType, CSSProperties } from "react";

  export type Point = { x: number; y: number };
  export type Area = { x: number; y: number; width: number; height: number };

  export type CropperProps = {
    image: string;
    crop: Point;
    zoom: number;
    aspect?: number;
    onCropChange: (location: Point) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
    cropShape?: "rect" | "round";
    showGrid?: boolean;
    restrictPosition?: boolean;
    style?: {
      containerStyle?: CSSProperties;
      mediaStyle?: CSSProperties;
      cropAreaStyle?: CSSProperties;
    };
  };

  const Cropper: ComponentType<CropperProps>;
  export default Cropper;
}
