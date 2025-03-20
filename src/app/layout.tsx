import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { DM_Serif_Display } from "next/font/google"; // Nueva tipografía

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local"; // Import localFont function
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: "400",
});

const nyghtSerif = localFont({
  src: [
    {
      path: "../fonts/NyghtSerif-BoldItalic.ttf", // Ruta a la fuente
      weight: "300",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "lot 9 studio",
  description: "La mejor ropa acorde a tu estilo",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${nyghtSerif.className} antialiased`}
      >
        {/* Navbar siempre visible */}
        <Navbar />

        {/* Contenido de la página */}
        <main className="min-h-screen pt-20">{children}</main>

        {/* Footer en todas las páginas */}
        <Footer />
      </body>
    </html>
  );
}
