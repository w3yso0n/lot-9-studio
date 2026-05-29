import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { getCloudinaryOrigin } from "@/lib/home-lcp";
import type { Metadata } from "next";

import "./globals.css";

import { inter, poppins } from "./fonts";

export const metadata: Metadata = {
  title: "lot 9 studio",
  description: "La mejor ropa acorde a tu estilo",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cloudinaryOrigin = getCloudinaryOrigin();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script src="/theme-init.js" />
        {cloudinaryOrigin ? (
          <>
            <link rel="dns-prefetch" href={cloudinaryOrigin} />
            <link rel="preconnect" href={cloudinaryOrigin} crossOrigin="anonymous" />
          </>
        ) : null}
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} ${inter.className} antialiased`}
      >
        <Navbar />
        <main className="min-h-screen pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
