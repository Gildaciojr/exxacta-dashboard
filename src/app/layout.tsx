import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exxacta Linkedin",
  description: "Sistema de prospecção de leads contábeis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE] text-[#0A2A5F]">
        {children}
      </body>
    </html>
  );
}
