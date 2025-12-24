import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Model Y | Tesla",
  description: "Configura tu Tesla Model Y. Diseño aerodinámico, gran autonomía y rendimiento excepcional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
