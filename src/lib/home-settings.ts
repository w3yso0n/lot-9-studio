export type HomeSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonHref: string;
  heroImageUrl: string;
  heroCropX: number;
  heroCropY: number;
  heroCropZoom: number;
  featuredVideoUrl: string;
  isHeroEnabled: boolean;
  isVideoEnabled: boolean;
  updatedAt?: string;
};

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  heroTitle: "NO TODOS\nLO ENTENDERÁN",
  heroSubtitle: "LOT9_STUDIO_GUADALAJARA",
  heroButtonText: "Descubre la colección",
  heroButtonHref: "/products#catalogo",
  heroImageUrl: "/images/background.png",
  heroCropX: 50,
  heroCropY: 50,
  heroCropZoom: 1,
  featuredVideoUrl: "/video1.mp4",
  isHeroEnabled: true,
  isVideoEnabled: true,
};
