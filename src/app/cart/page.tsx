"use client";
import { poppins } from "@/app/fonts";
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
import { motion } from "framer-motion";
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
      const color = (item.product as any).color || "";
      const productName = color ? `${item.product.name} - ${color}` : item.product.name;
      message += `- ${productName} (Talla: ${item.selectedSize}, Cantidad: ${item.quantity}) - $${(
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
    <section className={`container mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12 ${poppins.className}`}>
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10">
        {/* Sección principal del carrito */}
        <div className="lg:w-2/3">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Tu Carrito
            </h1>
            <Badge variant="secondary" className="text-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
            </Badge>
          </motion.div>

          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Card className="text-center py-10 sm:py-12 md:py-16 mx-auto max-w-md px-6">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ShoppingCartIcon className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                </motion.div>
                <h2 className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl font-medium text-gray-900 px-4">
                  Tu carrito está vacío
                </h2>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 px-4">
                  Agrega algunos productos para comenzar
                </p>
                <motion.div
                  className="mt-4 sm:mt-6 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="w-full sm:w-auto" size="lg" asChild>
                    <a href="/products">Ver productos</a>
                  </Button>
                </motion.div>
                
                {/* Sugerencias adicionales para móvil */}
                <div className="mt-6 px-4">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3">
                    ¿No sabes qué buscar?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <motion.button
                      className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Nuevos drops
                    </motion.button>
                    <motion.button
                      className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Más vendidos
                    </motion.button>
                    <motion.button
                      className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Ofertas
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 px-4 sm:px-6">
                <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                  <span>Productos</span>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm">
                      <Trash2Icon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Vaciar carrito</span>
                      <span className="sm:hidden">Vaciar</span>
                    </Button>
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
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
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="sticky top-8 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                    <span>Resumen del Pedido</span>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Barra de progreso para envío gratis */}
                {subtotal < freeShippingThreshold && (
                  <motion.div 
                    className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        Gasta ${(freeShippingThreshold - subtotal).toFixed(2)} más para envío gratis
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400">{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} className="h-3 bg-green-100 dark:bg-green-900" />
                  </motion.div>
                )}

                {/* Cupón de descuento */}
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-sm sm:text-base">Código de descuento</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="discount"
                      placeholder="Ingresa tu código"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={discountApplied}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={applyDiscount}
                      disabled={isApplyingDiscount || discountApplied}
                      className="w-full sm:w-auto"
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
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-green-600">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="font-medium">-${discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-medium">${shippingCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/20" 
                    size="lg" 
                    onClick={handleBuy}
                  >
                    Proceder a la compra <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
                
                <Alert className="text-xs sm:text-sm border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-sm sm:text-base text-blue-900 dark:text-blue-100">Compra protegida</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Reembolso garantizado si no recibes tu pedido
                  </AlertDescription>
                </Alert>

                </CardFooter>
              </Card>
            </motion.div>

            {/* Detalles de seguridad */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="link" className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
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