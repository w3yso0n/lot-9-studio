"use client";

import { CartCounter } from "@/components/ui/cart-counter";
import { useCartStore } from "@/store/cart";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      className="relative block active:scale-90"
      aria-label="Ver carrito"
      onClick={() => bumpCart()}
    >
      <span className={`relative inline-flex ${wiggle ? "cart-nav-wiggle" : ""}`}>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 text-foreground transition-colors hover:text-foreground/80 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <CartCounter />
      </span>
    </Link>
  );
}
