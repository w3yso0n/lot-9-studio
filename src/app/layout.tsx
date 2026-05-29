import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { getCloudinaryOrigin } from "@/lib/home-lcp";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init-script";
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
        {cloudinaryOrigin ? (
          <link rel="preconnect" href={cloudinaryOrigin} crossOrigin="anonymous" />
        ) : null}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
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
