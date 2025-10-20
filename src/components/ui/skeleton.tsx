"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "wave",
}: SkeletonProps) => {
  const baseClasses = "bg-gray-200 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    rectangular: "w-full h-full",
    circular: "rounded-full",
  };
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-wave",
    none: "",
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};

// Componente específico para tarjetas de producto
export const ProductCardSkeleton = () => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Imagen skeleton */}
        <Skeleton 
          className="w-full h-[400px]" 
          variant="rectangular"
          animation="wave"
        />
        
        {/* Contenido skeleton */}
        <div className="p-4 space-y-3">
          <Skeleton 
            className="h-6 w-3/4 mx-auto" 
            variant="text"
            animation="wave"
          />
          <div className="flex justify-center space-x-2">
            <Skeleton 
              className="h-6 w-12 rounded-full" 
              variant="rectangular"
              animation="wave"
            />
            <Skeleton 
              className="h-6 w-12 rounded-full" 
              variant="rectangular"
              animation="wave"
            />
            <Skeleton 
              className="h-6 w-12 rounded-full" 
              variant="rectangular"
              animation="wave"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para grid de productos
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <ProductCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};
