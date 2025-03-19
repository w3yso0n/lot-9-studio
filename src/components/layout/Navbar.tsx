"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaShoppingCart, FaTimes, FaUser } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        
        <Link href="/" className="text-xl font-bold">
        <Image
        src="/images/logo.png"
        alt="lot 9 studio"
        width={100}
        height={50}
        className="cursor-pointer"
        />
        </Link>

        {/* Menú Desktop */}
        <div className="hidden md:flex space-x-6">
          <Link href="/products" className="hover:text-gray-600 transition">
            Productos
          </Link>
          <Link href="/about" className="hover:text-gray-600 transition">
            Nosotros
          </Link>
          <Link href="/contact" className="hover:text-gray-600 transition">
            Contacto
          </Link>
        </div>

        {/* Iconos */}
        <div className="flex items-center space-x-4">
          <Link href="/cart">
            <FaShoppingCart className="w-6 h-6 hover:text-gray-600 transition" />
          </Link>
          <Link href="/profile">
            <FaUser className="w-6 h-6 hover:text-gray-600 transition" />
          </Link>

          {/* Menú Móvil */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md absolute w-full left-0 top-16 p-4 flex flex-col space-y-4">
          <Link href="/products" className="hover:text-gray-600 transition" onClick={() => setIsOpen(false)}>
            Productos
          </Link>
          <Link href="/about" className="hover:text-gray-600 transition" onClick={() => setIsOpen(false)}>
            Nosotros
          </Link>
          <Link href="/contact" className="hover:text-gray-600 transition" onClick={() => setIsOpen(false)}>
            Contacto
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
