export type HomeSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonHref: string;
  heroImageUrl: string;
  featuredVideoUrl: string;
  isHeroEnabled: boolean;
  isVideoEnabled: boolean;
  updatedAt?: string;
};

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  heroTitle: "NO\nTODOS\nLO\nENTENDERAN",
  heroSubtitle: "LOT9_STUDIO_GUADALAJARA",
  heroButtonText: "Descubre la colección",
  heroButtonHref: "#catalogo",
  heroImageUrl: "/images/background.png",
  featuredVideoUrl: "/video1.mp4",
  isHeroEnabled: true,
  isVideoEnabled: true,
};
