import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppInitializer } from "./AppInitializer";
import { Analytics } from "@vercel/analytics/react"
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
  title: {
    default: "Ozio — Descubre el ocio nocturno de tu ciudad",
    template: "%s | Ozio",
  },
  description:
    "Ozio es la app para descubrir bares, discotecas y planes nocturnos cerca de ti. Consulta el ambiente en tiempo real, haz check-in y encuentra los mejores locales de tu ciudad.",
  keywords: [
    "ocio nocturno",
    "bares",
    "discotecas",
    "planes nocturnos",
    "vida nocturna",
    "check-in",
    "locales",
    "nightlife",
    "ozio",
  ],
  authors: [{ name: "Ozio" }],
  creator: "Ozio",
  applicationName: "Ozio",
  category: "entertainment",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Ozio — Descubre el ocio nocturno de tu ciudad",
    description:
      "Consulta el ambiente en tiempo real, haz check-in y encuentra los mejores locales cerca de ti.",
    url: "https://ocio-virid.vercel.app",
    siteName: "Ozio",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ozio — Descubre el ocio nocturno de tu ciudad",
    description:
      "Consulta el ambiente en tiempo real, haz check-in y encuentra los mejores locales cerca de ti.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(localStorage.getItem('ozio-theme')==='light')document.documentElement.classList.add('light')})()` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  );
}