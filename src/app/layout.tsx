import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { DM_Serif_Display } from "next/font/google"; // Nueva tipografía

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        className={`${dmSerif.variable} antialiased`}
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
