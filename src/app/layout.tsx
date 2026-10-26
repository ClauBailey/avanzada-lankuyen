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
  title: {
    default: "Avanzada Lankuyen",
    template: "%s · Avanzada Lankuyen",
  },
  description:
    "Plataforma de la Avanzada Lankuyen: progresión personal, calendario, asistencia, hojas de ruta y material de la unidad.",
  icons: {
    icon: "/brand/logo-lankuyen.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#15173a",
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
