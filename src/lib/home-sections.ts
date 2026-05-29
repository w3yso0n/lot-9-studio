export type HomeSectionType =
  | "hero"
  | "banner"
  | "carousel"
  | "video"
  | "new_drops"
  | "catalog"
  | "text";

export type HomeSection = {
  id: number;
  type: HomeSectionType;
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isEnabled: boolean;
};
