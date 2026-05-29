"use client";

import { useIsMounted } from "@/hooks/useHydration";
import { useCartStore } from "@/store/cart";
import { AnimatePresence, motion } from "framer-motion";

interface CartCounterProps {
  className?: string;
}

export const CartCounter = ({ className = "" }: CartCounterProps) => {
  const { getTotalItems } = useCartStore();
  const isMounted = useIsMounted();
  const itemCount = getTotalItems();
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence mode="popLayout">
      {itemCount > 0 && (
        <motion.span
          key={itemCount}
          className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1], opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {itemCount}
        </motion.span>
      )}
    </AnimatePresence>
  );
};
