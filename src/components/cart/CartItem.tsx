"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import Image from "next/image";

interface CartItemProps {
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
  };
  selectedSize: string; // selectedSize como prop independiente
  quantity: number; // quantity como prop independiente
}

const CartItem = ({ product, selectedSize, quantity }: CartItemProps) => {
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={80}
          height={80}
          className="rounded-md"
        />
        <div>
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="text-gray-600">
            ${product.price.toFixed(2)} x {quantity} (Talla: {selectedSize})
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        onClick={() => removeFromCart(product.id, selectedSize)} // Pasa id y selectedSize
      >
        Eliminar
      </Button>

      <Button
  variant="outline"
  onClick={() => decreaseQuantity(product.id, selectedSize)}
>
  -
</Button>
    </div>
  );
};

export default CartItem;