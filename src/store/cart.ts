import { create } from "zustand";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Nuevo tipo CartItem que incluye selectedSize
interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string; // Añade selectedSize
}

interface CartState {
  cart: CartItem[]; // Usa CartItem en lugar de Product
  addToCart: (product: Product, selectedSize: string) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: [],

  // Modifica addToCart para aceptar selectedSize
  addToCart: (product, selectedSize) =>
    set((state) => {
      const existingItem = state.cart.find(
        (item) => item.product.id === product.id && item.selectedSize === selectedSize
      );

      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id && item.selectedSize === selectedSize
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        cart: [...state.cart, { product, quantity: 1, selectedSize }],
      };
    }),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== id),
    })),

  clearCart: () => set({ cart: [] }),
}));