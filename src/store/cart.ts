import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  sizes?: string[]; // Tallas disponibles
  colors?: string[]; // Colores disponibles
  discount?: number; // Descuento opcional
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor?: string; // Color seleccionado
  addedAt: Date; // Fecha de agregado al carrito
}

interface CartState {
  cart: CartItem[];
  isOpen: boolean; // Estado del drawer del carrito
  addToCart: (product: Product, selectedSize: string, selectedColor?: string) => void;
  removeFromCart: (id: number, selectedSize: string, selectedColor?: string) => void;
  increaseQuantity: (id: number, selectedSize: string, selectedColor?: string) => void;
  decreaseQuantity: (id: number, selectedSize: string, selectedColor?: string) => void;
  updateQuantity: (id: number, selectedSize: string, newQuantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void; // Alternar visibilidad del carrito
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>;
  selectedDiscount?: {
    code: string;
    value: number; // Puede ser porcentaje o cantidad fija
    type: 'percentage' | 'fixed';
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isOpen: false,
      selectedDiscount: undefined,

      // Agregar al carrito
      addToCart: (product, selectedSize, selectedColor) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => 
              item.product.id === product.id && 
              item.selectedSize === selectedSize &&
              (!selectedColor || item.selectedColor === selectedColor)
          );

          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id && 
                item.selectedSize === selectedSize &&
                (!selectedColor || item.selectedColor === selectedColor)
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return {
            cart: [
              ...state.cart, 
              { 
                product, 
                quantity: 1, 
                selectedSize, 
                selectedColor,
                addedAt: new Date() 
              }
            ],
          };
        }),

      // Eliminar del carrito
      removeFromCart: (id, selectedSize, selectedColor) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => 
              !(item.product.id === id && 
              item.selectedSize === selectedSize &&
              (!selectedColor || item.selectedColor === selectedColor))
          ),
        })),

      // Aumentar cantidad
      increaseQuantity: (id, selectedSize, selectedColor) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === id && 
            item.selectedSize === selectedSize &&
            (!selectedColor || item.selectedColor === selectedColor)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),

      // Disminuir cantidad (y eliminar si llega a 0)
      decreaseQuantity: (id, selectedSize, selectedColor) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.product.id === id && 
              item.selectedSize === selectedSize &&
              (!selectedColor || item.selectedColor === selectedColor)
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      // Actualizar cantidad específica
      updateQuantity: (id, selectedSize, newQuantity, selectedColor) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.product.id === id && 
              item.selectedSize === selectedSize &&
              (!selectedColor || item.selectedColor === selectedColor)
                ? { ...item, quantity: Math.max(1, newQuantity) } // Mínimo 1
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      // Vaciar carrito
      clearCart: () => set({ cart: [], selectedDiscount: undefined }),

      // Alternar visibilidad del carrito
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Obtener número total de ítems
      getTotalItems: () => get().cart.reduce((total, item) => total + item.quantity, 0),

      // Obtener subtotal (sin descuentos)
      getSubtotal: () =>
        get().cart.reduce(
          (sum, item) => sum + (item.product.discount 
            ? item.product.price * (1 - item.product.discount) * item.quantity 
            : item.product.price * item.quantity),
          0
        ),

      // Obtener total (con descuentos aplicados)
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().selectedDiscount;
        
        if (!discount) return subtotal;
        
        if (discount.type === 'percentage') {
          return subtotal * (1 - discount.value / 100);
        } else {
          return Math.max(0, subtotal - discount.value);
        }
      },

      // Aplicar descuento (simula llamada a API)
      applyDiscount: async (code) => {
        // Simulamos una llamada a API con códigos de descuento
        const validCodes: Record<string, { value: number; type: 'fixed' | 'percentage' }> = {
          'LOT9STUDIO': { value: 10, type: 'percentage' },
          'SALE20': { value: 20, type: 'percentage' },
          'ENVIOGRATIS': { value: 5, type: 'fixed' } // $5 de descuento
        };

        await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de red

        if (validCodes[code as keyof typeof validCodes]) {
          set({ 
            selectedDiscount: { 
              code, 
              ...validCodes[code as keyof typeof validCodes] 
            } 
          });
          return { success: true, message: 'Descuento aplicado correctamente' };
        } else {
          return { success: false, message: 'Código de descuento no válido' };
        }
      }
    }),
    {
      name: 'cart-storage', // nombre para el localStorage
      partialize: (state) => ({ cart: state.cart }), // solo persistir el carrito
    }
  )
);