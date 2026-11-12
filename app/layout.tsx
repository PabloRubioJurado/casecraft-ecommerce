import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CaseCraft E-Commerce',
  description: 'Tienda en línea de CaseCraft',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}