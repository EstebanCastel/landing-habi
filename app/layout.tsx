import type { Metadata } from "next";
import { Suspense } from "react";
import GoogleAnalytics from "./components/google-analytics";
import SegmentScript from "./components/segment-analytics";
import PageViewTracker from "./components/page-view-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habi | Vende tu inmueble",
  description: "Vende tu inmueble de forma rápida y segura con Habi. Te compramos directamente o te ayudamos a vender.",
  icons: {
    icon: '/habilogo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <GoogleAnalytics />
        <SegmentScript />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
