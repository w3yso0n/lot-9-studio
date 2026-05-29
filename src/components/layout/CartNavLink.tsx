"use client";

import { CartCounter } from "@/components/ui/cart-counter";
import { useCartStore } from "@/store/cart";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";

export function CartNavLink() {
  const cartBumpKey = useCartStore((s) => s.cartBumpKey);
  const bumpCart = useCartStore((s) => s.bumpCart);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    if (cartBumpKey === 0) return;
    setWiggle(true);
    const timer = window.setTimeout(() => setWiggle(false), 550);
    return () => window.clearTimeout(timer);
  }, [cartBumpKey]);

  return (
    <Link
      href="/cart"
      className="relative block"
      aria-label="Ver carrito"
      onClick={() => bumpCart()}
    >
      <motion.span
        className="relative inline-flex"
        animate={
          wiggle
            ? {
                scale: [1, 1.24, 0.94, 1.08, 1],
                rotate: [0, -16, 14, -6, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileTap={{ scale: 0.86 }}
      >
        <FaShoppingCart className="h-4 w-4 text-foreground transition-colors hover:text-foreground/80 sm:h-5 sm:w-5" />
        <CartCounter />
      </motion.span>
    </Link>
  );
}
