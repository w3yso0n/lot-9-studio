"use client";

import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200" />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          rotate: theme === "dark" ? 360 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        {theme === "dark" ? (
          <FaMoon className="w-5 h-5 text-yellow-300" />
        ) : (
          <FaSun className="w-5 h-5 text-orange-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
