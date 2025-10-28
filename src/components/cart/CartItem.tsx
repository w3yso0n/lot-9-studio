"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    discount?: number;
    color?: string;
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      {/* Product Info */}
      <div className="flex items-start gap-4 w-full sm:w-auto">
        <motion.div 
          className="relative aspect-square w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        </motion.div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
            {product.name}
            {product.color && <span className="text-gray-600 dark:text-gray-400"> - {product.color}</span>}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Talla: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedSize}</span>
          </p>
          
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
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => decreaseQuantity(product.id, selectedSize)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </motion.div>
          
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-16 h-8 text-center font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
          />
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => increaseQuantity(product.id, selectedSize)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive/80 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={onRemove}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CartItem;