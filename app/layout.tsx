import type { Metadata } from "next";
import { PostHogProvider } from "./components/posthog-provider";
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
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
