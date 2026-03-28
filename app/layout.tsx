import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppInitializer } from "./AppInitializer"; // 👈
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ozio",
  description: "Ozio es una aplicación para descubrir y compartir lugares de ocio en tu ciudad. Encuentra bares, restaurantes, parques y más, con opiniones y fotos de otros usuarios. ¡Explora tu ciudad como nunca antes con Ozio!",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppInitializer /> {/* 👈 Carga datos una sola vez */}
        {children}
      </body>
    </html>
  );
}