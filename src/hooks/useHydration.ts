"use client";

import { useEffect, useState } from "react";

/**
 * Hook para evitar problemas de hidratación en Next.js
 * Retorna true solo después de que el componente se haya montado en el cliente
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};

/**
 * Hook para manejar estados que pueden causar problemas de hidratación
 * Útil para elementos que dependen del estado del cliente
 */
export const useClientState = <T>(initialValue: T, clientValue: T) => {
  const isMounted = useIsMounted();
  return isMounted ? clientValue : initialValue;
};

/**
 * Hook para animaciones que solo deben ejecutarse en el cliente
 */
export const useClientAnimation = () => {
  const isMounted = useIsMounted();
  
  return {
    shouldAnimate: isMounted,
    animationProps: isMounted ? {} : { initial: false, animate: false }
  };
};
