import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Avanzada Lankuyen",
  title: {
    default: "Avanzada Lankuyen",
    template: "%s · Avanzada Lankuyen",
  },
  description:
    "Plataforma de la Avanzada Lankuyen: progresión personal, calendario, asistencia, hojas de ruta y material de la unidad.",
  icons: {
    icon: [
      { url: "/brand/logo-lankuyen.svg", type: "image/svg+xml" },
      { url: "/brand/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lankuyen",
  },
};

export const viewport: Viewport = {
  themeColor: "#312e81",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
