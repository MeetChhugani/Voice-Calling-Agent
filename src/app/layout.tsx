import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhruv | HDFC Bank Assistance Prototype",
  description:
    "Speak with Dhruv, an HDFC Bank customer assistance voice agent prototype.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-red-500/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
