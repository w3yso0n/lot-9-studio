"use client";

import { useIsMounted } from "@/hooks/useHydration";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Componente que solo renderiza sus hijos en el cliente
 * Útil para evitar problemas de hidratación con animaciones
 */
export const ClientOnly = ({ 
  children, 
  fallback = null, 
  className = "" 
}: ClientOnlyProps) => {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
};

interface AnimatedClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  animationProps?: any;
}

/**
 * Componente que renderiza animaciones solo en el cliente
 * Evita problemas de hidratación con Framer Motion
 */
export const AnimatedClientOnly = ({ 
  children, 
  fallback = null, 
  className = "",
  animationProps = {}
}: AnimatedClientOnlyProps) => {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return (
    <motion.div className={className} {...animationProps}>
      {children}
    </motion.div>
  );
};
