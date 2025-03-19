"use client";
import CartItem from "@/components/cart/CartItem";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const { cart, clearCart } = useCartStore();

  const total = cart.reduce((sum, product) => sum + product.price * product.quantity, 0);

  return (
    <section className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">🛒 Carrito de Compras</h1>

      {cart.length === 0 ? (
        <p className="text-center text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {cart.map((product) => (
            <CartItem key={product.id} product={product} />
          ))}
          <div className="flex justify-between items-center border-t pt-4">
            <h2 className="text-xl font-bold">Total: ${total.toFixed(2)}</h2>
            <Button variant="destructive" onClick={clearCart}>Vaciar carrito</Button>
          </div>
        </div>
      )}
    </section>
  );
}
