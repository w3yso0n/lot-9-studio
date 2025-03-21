// src/app/fonts.ts
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-secondary",
  weight: "400",
});

export const nyghtSerif = localFont({
  src: [
    {
      path: "../fonts/NyghtSerif-BoldItalic.ttf", // Ruta a la fuente
      weight: "300",
      style: "normal",
    },
  ],
});
