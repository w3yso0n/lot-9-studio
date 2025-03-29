"use client";
import { montserrat } from "@/app/fonts";
import CartItem from "@/components/cart/CartItem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart";
import { ArrowRightIcon, ShieldCheckIcon, ShoppingCartIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { cart, clearCart, updateQuantity, removeFromCart } = useCartStore();
  const [discountCode, setDiscountCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calcular subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Calcular total con descuento y envío
  let shippingCost = shippingMethod === "express" ? 15 : 5;
  shippingCost = 0;
  const total = subtotal - discountValue + shippingCost;

  // Aplicar descuento (simulado)
  const applyDiscount = () => {
    setIsApplyingDiscount(true);
    setTimeout(() => {
      if (discountCode.toUpperCase() === "LOT9STUDIO") {
        setDiscountValue(subtotal * 0.1);
        setDiscountApplied(true);
      } else {
        setDiscountValue(0);
        setDiscountApplied(false);
      }
      setIsApplyingDiscount(false);
    }, 1000);
  };

  // Manejar compra
  const handleBuy = () => {
    let message = "¡Hola! Quiero realizar la siguiente compra:\n\n";

    cart.forEach((item) => {
      message += `- ${item.product.name} (Talla: ${item.selectedSize}, Cantidad: ${item.quantity}) - $${(
        item.product.price * item.quantity
      ).toFixed(2)}\n`;
    });

    message += `\nSubtotal: $${subtotal.toFixed(2)}`;
    if (discountValue > 0) {
      message += `\nDescuento: -$${discountValue.toFixed(2)}`;
    }
    // message += `\nEnvío: $${shippingCost.toFixed(2)}`;
    message += `\nTotal: $${total.toFixed(2)}`;

    const phoneNumber = "523318592665";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Progreso para envío gratis
  const freeShippingThreshold = 100;
  const progressValue = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  if (!isMounted) return null;

  return (
    <section className={`container mx-auto py-8 px-4 sm:px-6 lg:px-8 ${montserrat.className}`}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sección principal del carrito */}
        <div className="lg:w-2/3">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold">Tu Carrito</h1>
            <Badge variant="secondary" className="text-sm">
              {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
            </Badge>
          </div>

          {cart.length === 0 ? (
            <Card className="text-center py-12">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-lg font-medium text-gray-900">Tu carrito está vacío</h2>
              <p className="mt-1 text-gray-500">Agrega algunos productos para comenzar</p>
              <Button className="mt-6" asChild>
                <a href="/products">Ver productos</a>
              </Button>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex justify-between items-center">
                  <span>Productos</span>
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                    <Trash2Icon className="w-4 h-4 mr-2" />
                    Vaciar carrito
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {cart.map((item) => (
                  <CartItem
                    key={`${item.product.id}-${item.selectedSize}`}
                    product={item.product}
                    selectedSize={item.selectedSize}
                    quantity={item.quantity}
                    onUpdateQuantity={(newQuantity: number) => updateQuantity(item.product.id, item.selectedSize, newQuantity)}
                    onRemove={() => removeFromCart(item.product.id, item.selectedSize)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen del pedido */}
        {cart.length > 0 && (
          <div className="lg:w-1/3">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barra de progreso para envío gratis */}
                {subtotal < freeShippingThreshold && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Gasta ${(freeShippingThreshold - subtotal).toFixed(2)} más para envío gratis
                      </span>
                      <span>{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                )}

                {/* Cupón de descuento */}
                <div className="space-y-2">
                  <Label htmlFor="discount">Código de descuento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      placeholder="Ingresa tu código"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={discountApplied}
                    />
                    <Button
                      variant="secondary"
                      onClick={applyDiscount}
                      disabled={isApplyingDiscount || discountApplied}
                    >
                      {isApplyingDiscount ? "Aplicando..." : discountApplied ? "Aplicado" : "Aplicar"}
                    </Button>
                  </div>
                  {discountApplied && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <TicketIcon className="w-4 h-4" />
                      Descuento de ${discountValue.toFixed(2)} aplicado
                    </p>
                  )}
                </div>

                {/* Método de envío */}
                {/* <div className="space-y-2">
                  <Label>Método de envío</Label>
                  <Select value={shippingMethod} onValueChange={setShippingMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona envío" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex justify-between w-full">
                          <span>Estándar</span>
                          <span>$5.00</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="express">
                        <div className="flex justify-between w-full">
                          <span>Express</span>
                          <span>$15.00</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                {/* Resumen de precios */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">Descuento</span>
                      <span>-${discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" size="lg" onClick={handleBuy}>
                  Proceder a la compra <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
                
                <Alert className="text-sm">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertTitle>Compra protegida</AlertTitle>
                  <AlertDescription>
                    Reembolso garantizado si no recibes tu pedido
                  </AlertDescription>
                </Alert>

              </CardFooter>
            </Card>

            {/* Detalles de seguridad */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="link" className="text-sm text-muted-foreground mt-4">
                  ¿Necesitas ayuda con tu compra?
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Asistencia de compra</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <h3 className="font-medium mb-2">Política de devoluciones</h3>
                    <p className="text-sm text-muted-foreground">
                      Aceptamos devoluciones dentro de los 30 días posteriores a la compra. 
                      El producto debe estar en su estado original.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Envíos y entregas</h3>
                    <p className="text-sm text-muted-foreground">
                      Los envíos estándar tardan 3-5 días hábiles. Los envíos express llegan 
                      en 1-2 días hábiles. Entregamos de lunes a viernes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Contacto</h3>
                    <p className="text-sm text-muted-foreground">
                      Para cualquier duda, contáctanos en support@tienda.com o al +52 33 1859 2665.
                    </p>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="secondary" className="w-full">
                    Contactar soporte
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </section>
  );
}