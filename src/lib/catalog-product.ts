/** Producto tal como lo consume la tienda (antes venía de `data.ts`). */
export type CatalogProduct = {
  id: number;
  name: string;
  price: number;
  color: string;
  images: string[];
  stockBySize: Record<string, number>;
  sizes: string[];
  colors: string[];
  desc: string;
};
