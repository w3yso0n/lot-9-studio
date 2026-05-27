/** Producto tal como lo consume la tienda (antes venía de `data.ts`). */
export type CatalogProduct = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number | null;
  code?: string | number;
  color: string;
  images: string[];
  coverImage?: string | null;
  hoverImage?: string | null;
  stockBySize: Record<string, number>;
  sizes: string[];
  colors: string[];
  desc: string;
  /** En listados: evita agregar todo el stock por talla en SQL. */
  inStock?: boolean;
  variants?: CatalogProductVariant[];
  colorVariants?: CatalogProductColorVariant[];
};

export type CatalogProductVariant = {
  id: number;
  name: string;
  color: string;
  image: string;
};

export type CatalogProductColorVariant = {
  label: string;
  images: string[];
  stockBySize: Record<string, number>;
};
