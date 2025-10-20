"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
  once?: boolean;
}

export const ScrollReveal = ({
  children,
  direction = "up",
  distance = 50,
  duration = 0.6,
  delay = 0,
  className = "",
  once = true,
}: ScrollRevealProps) => {
  const variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? -distance : direction === "right" ? distance : 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-100px" }}
    >
      {children}
    </motion.div>
  );
};

// Componente específico para texto
export const RevealText = ({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => {
  return (
    <ScrollReveal direction="up" distance={30} delay={delay} className={className}>
      {children}
    </ScrollReveal>
  );
};

// Componente para elementos que aparecen desde los lados
export const RevealFromSide = ({
  children,
  side = "left",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
  delay?: number;
}) => {
  return (
    <ScrollReveal 
      direction={side} 
      distance={100} 
      delay={delay} 
      className={className}
    >
      {children}
    </ScrollReveal>
  );
};
