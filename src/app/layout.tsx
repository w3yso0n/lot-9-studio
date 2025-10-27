import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

import { inter, poppins } from "./fonts";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${inter.className} antialiased`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}