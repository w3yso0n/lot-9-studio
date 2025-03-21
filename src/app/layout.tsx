import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

import "./globals.css";

import { montserrat, nyghtSerif } from "./fonts";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${nyghtSerif.className} ${montserrat.className} antialiased`}
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