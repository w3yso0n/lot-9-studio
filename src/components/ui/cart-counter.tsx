"use client";

import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

interface CartCounterProps {
  className?: string;
}

export const CartCounter = ({ className = "" }: CartCounterProps) => {
  const itemCount = useCartStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || itemCount <= 0) {
    return null;
  }

  return (
    <span
      key={itemCount}
      className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white cart-counter-pop ${className}`}
    >
      {itemCount}
    </span>
  );
};
