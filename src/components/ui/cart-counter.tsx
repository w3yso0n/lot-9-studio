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

  // No mostrar nada hasta que esté montado
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.span 
          className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {itemCount}
        </motion.span>
      )}
    </AnimatePresence>
  );
};
