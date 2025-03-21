import { create } from "zustand";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string; // Añade selectedSize
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product, selectedSize: string) => void;
  removeFromCart: (id: number, selectedSize: string) => void;
  decreaseQuantity: (id: number, selectedSize: string) => void; // Nueva función
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: [],

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

  removeFromCart: (id, selectedSize) =>
    set((state) => ({
      cart: state.cart.filter(
        (item) => !(item.product.id === id && item.selectedSize === selectedSize)
      ),
    })),

  // Función para disminuir la cantidad
  decreaseQuantity: (id, selectedSize) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter((item) => item.quantity > 0), // Elimina el ítem si la cantidad llega a 0
    })),

  clearCart: () => set({ cart: [] }),
}));