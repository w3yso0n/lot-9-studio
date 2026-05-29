"use client";

import { CartNavLink } from "@/components/layout/CartNavLink";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const navLinkClass =
  "text-foreground/80 hover:text-foreground transition-colors font-medium relative group";

function NavLinkUnderline() {
  return (
    <motion.div
      className="absolute -bottom-1 left-0 h-0.5 w-0 bg-foreground transition-all duration-300 group-hover:w-full"
      initial={false}
      whileHover={{ width: "100%" }}
    />
  );
}

const mobileRowClass =
  "block border-b border-border py-2 text-foreground/80 transition-colors hover:text-foreground";

const Navbar = () => {
  const pathname = usePathname();
  const isAdminDashboard = pathname.startsWith("/admin/dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 z-50 w-full bg-background/90 backdrop-blur-md shadow-lg transition-all duration-500 dark:bg-card/90 ${
        isScrolled ? 'py-2' : 'py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto flex justify-between items-center px-3 sm:px-4">
        {/* Logo con animación */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 sm:gap-3 min-w-0"
        >
          <Link href={isAdminDashboard ? "/admin/dashboard" : "/"} className="text-xl font-bold flex-shrink-0 flex items-center gap-2 sm:gap-3">
            <Image
              src="/images/logo.png"
              alt="lot 9 studio"
              width={120}
              height={60}
              className={`cursor-pointer transition-all duration-500 ${
                isScrolled ? 'h-8 sm:h-10 w-auto' : 'h-10 sm:h-12 w-auto'
              }`}
              priority
            />
            {isAdminDashboard ? (
              <span className="hidden whitespace-nowrap border-l border-border pl-2 text-xs font-semibold tracking-tight text-foreground sm:inline sm:pl-3 sm:text-sm">
                Admin
              </span>
            ) : null}
          </Link>
        </motion.div>

        {/* Menú Desktop */}
        <motion.div
          className="hidden md:flex space-x-8 ml-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isAdminDashboard ? (
            <motion.div whileHover={{ y: -2 }}>
              <Link href="/admin/dashboard" className={`${navLinkClass} inline-block`}>
                Catálogo
                <NavLinkUnderline />
              </Link>
            </motion.div>
          ) : (
            <motion.div whileHover={{ y: -2 }}>
              <Link href="/products" className={`${navLinkClass} inline-block`}>
                Productos
                <NavLinkUnderline />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Iconos / acciones */}
        <motion.div
          className="flex items-center space-x-3 sm:space-x-4 md:space-x-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ThemeToggle />

          {isAdminDashboard ? (
            <>
              <motion.div className="hidden md:block" whileHover={{ y: -2 }}>
                <Link href="/" className={`${navLinkClass} text-sm whitespace-nowrap inline-block`}>
                  Ver tienda
                  <NavLinkUnderline />
                </Link>
              </motion.div>
              <form action="/api/admin/logout" method="post" className="hidden md:block">
                <motion.button
                  type="submit"
                  className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
                  whileHover={{ y: -1 }}
                >
                  Cerrar sesión
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }}>
              <CartNavLink />
            </motion.div>
          )}

          <motion.button
            className="md:hidden p-1 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <FaTimes className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
              ) : (
                <FaBars className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
              )}
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* Menú Móvil con animaciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute left-0 top-full w-full bg-background/95 backdrop-blur-md shadow-xl md:hidden dark:bg-card/95"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-3 sm:px-4 py-3 flex flex-col space-y-3">
              {isAdminDashboard ? (
                <>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href="/admin/dashboard"
                      className={mobileRowClass}
                      onClick={() => setIsOpen(false)}
                    >
                      Catálogo
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link href="/" className={mobileRowClass} onClick={() => setIsOpen(false)}>
                      Ver tienda
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <form action="/api/admin/logout" method="post">
                      <button
                        type="submit"
                        className={`${mobileRowClass} w-full text-left font-medium`}
                      >
                        Cerrar sesión
                      </button>
                    </form>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    href="/products"
                    className={mobileRowClass}
                    onClick={() => setIsOpen(false)}
                  >
                    Productos
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;