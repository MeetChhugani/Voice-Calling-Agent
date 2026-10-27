import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tisha | Studio Olives Cre — Architectural Voice Consultation",
  description:
    "Schedule an exclusive architectural & interior design consultation with Studio Olives Cre, guided by Tisha, our AI consultation coordinator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#C5A059]/20 selection:text-[#18191A]">
        {children}
      </body>
    </html>
  );
}
