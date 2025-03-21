"use client";
import CartItem from "@/components/cart/CartItem";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const { cart, clearCart } = useCartStore();

  // Calcular el total del carrito
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleBuy = () => {
    // Generar el mensaje con los detalles del carrito
    let message = "¡Hola! Quiero realizar la siguiente compra:\n\n";

    cart.forEach((item) => {
      message += `- ${item.product.name} (Talla: ${item.selectedSize}, Cantidad: ${item.quantity}) - $${(
        item.product.price * item.quantity
      ).toFixed(2)}\n`;
    });

    message += `\nTotal: $${total.toFixed(2)}`;

    // Número de WhatsApp Business (reemplaza con tu número)
    const phoneNumber = "523318592665"; // Asegúrate de incluir el código de país
    // Correo electrónico (reemplaza con tu correo)
    const email = "tucorreo@example.com";

    // Redirigir a WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");

    // Alternativa: Redirigir al cliente de correo electrónico
    // const mailtoUrl = `mailto:${email}?subject=Compra&body=${encodeURIComponent(message)}`;
    // window.location.href = mailtoUrl;
  };

  return (
    <section className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Carrito de Compras</h1>

      {cart.length === 0 ? (
        <p className="text-center text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {cart.map((item) => (
            <CartItem
              key={`${item.product.id}-${item.selectedSize}`}
              product={item.product} // Pasa el producto
              selectedSize={item.selectedSize} // Pasa la talla seleccionada
              quantity={item.quantity} // Pasa la cantidad
            />
          ))}
          <div className="flex justify-between items-center border-t pt-4">
            <h2 className="text-xl font-bold">Total: ${total.toFixed(2)}</h2>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={clearCart}>
                Vaciar carrito
              </Button>
              <Button onClick={handleBuy}>Comprar</Button> {/* Botón para comprar */}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}