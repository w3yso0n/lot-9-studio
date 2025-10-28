// src/app/checkout/page.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Sección de Información del Cliente */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
          <form>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" type="text" placeholder="Ingresa tu nombre" />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="Ingresa tu correo" />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" type="text" placeholder="Ingresa tu dirección" />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="Ingresa tu teléfono" />
              </div>
            </div>
          </form>
        </div>

        {/* Sección de Resumen del Pedido */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 sm:mb-6">Resumen del Pedido</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Producto 1</span>
              <span>$20.00</span>
            </div>
            <div className="flex justify-between">
              <span>Producto 2</span>
              <span>$30.00</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>$50.00</span>
              </div>
            </div>
          </div>
          <Button className="w-full mt-6 sm:mt-8" size="lg">Realizar Pedido</Button>
        </div>
      </div>
    </div>
  );
}