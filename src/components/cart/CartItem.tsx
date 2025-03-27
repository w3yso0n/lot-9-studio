"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    discount?: number;
  };
  selectedSize: string;
  quantity: number;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
}

const CartItem = ({ product, selectedSize, quantity, onUpdateQuantity, onRemove }: CartItemProps) => {
  const { increaseQuantity, decreaseQuantity } = useCartStore();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(newQuantity);
    }
  };

  const discountedPrice = product.discount 
    ? product.price * (1 - product.discount)
    : product.price;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-4">
      {/* Product Info */}
      <div className="flex items-start gap-4 w-full sm:w-auto">
        <div className="relative aspect-square w-20 h-20 flex-shrink-0">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="rounded-md object-cover"
            sizes="80px"
          />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-base">{product.name}</h3>
          <p className="text-sm text-muted-foreground">Talla: {selectedSize}</p>
          
          {/* Price display */}
          <div className="flex items-center gap-2 mt-1">
            {product.discount ? (
              <>
                <span className="font-bold text-primary">
                  ${(discountedPrice * quantity).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ${(product.price * quantity).toFixed(2)}
                </span>
                <span className="text-xs text-green-600 border-green-200 bg-green-50 px-2 py-1 rounded">
                  {product.discount * 100}% OFF
                </span>
              </>
            ) : (
              <span className="font-bold">
                ${(product.price * quantity).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => decreaseQuantity(product.id, selectedSize)}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-12 h-8 text-center"
          />
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => increaseQuantity(product.id, selectedSize)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive/80"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;