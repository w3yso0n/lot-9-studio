// src/app/fonts.ts
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente principal: Inter (muy neutra y moderna)
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: ["300", "400", "500", "600", "700"],
});

// Fuente secundaria: Poppins (neutral pero con personalidad)
export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-secondary",
  weight: ["300", "400", "500", "600", "700"],
});
