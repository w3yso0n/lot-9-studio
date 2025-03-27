"use client";

import { useCartStore } from "@/store/cart"; // Importa tu store de carrito
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBars, FaShoppingCart, FaTimes, FaUser } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart, getTotalItems } = useCartStore(); // Obtén los datos del carrito

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
    <nav className={`bg-white/80 backdrop-blur-sm shadow-sm fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold flex-shrink-0">
          <Image
            src="/images/logo.png"
            alt="lot 9 studio"
            width={120}
            height={60}
            className={`cursor-pointer transition-all duration-300 ${isScrolled ? 'h-10 w-auto' : 'h-12 w-auto'}`}
            priority
          />
        </Link>

        {/* Menú Desktop */}
        <div className="hidden md:flex space-x-8 ml-8">
          <Link href="/products" className="text-gray-700 hover:text-black transition-colors font-medium">
            Productos
          </Link>
          {/* <Link href="/about" className="text-gray-700 hover:text-black transition-colors font-medium">
            Nosotros
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-black transition-colors font-medium">
            Contacto
          </Link> */}
        </div>

        {/* Iconos */}
        <div className="flex items-center space-x-6">
          <Link href="/cart" className="relative">
            <FaShoppingCart className="w-5 h-5 text-gray-700 hover:text-black transition-colors" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Link>
          
          <Link href="/profile">
            <FaUser className="w-5 h-5 text-gray-700 hover:text-black transition-colors" />
          </Link>

          {/* Menú Móvil */}
          <button 
            className="md:hidden p-1 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <FaTimes className="w-5 h-5 text-gray-700" />
            ) : (
              <FaBars className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm shadow-lg absolute w-full left-0 top-full px-4 py-3 flex flex-col space-y-3 animate-fadeIn">
          <Link 
            href="/products" 
            className="text-gray-700 hover:text-black transition-colors py-2 border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Productos
          </Link>
          {/* <Link 
            href="/about" 
            className="text-gray-700 hover:text-black transition-colors py-2 border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Nosotros
          </Link> */}
        </div>
      )}
    </nav>
  );
};

export default Navbar;