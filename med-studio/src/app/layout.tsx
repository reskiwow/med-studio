import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MED STUDIO",
  description: "Audio processing & Roblox publishing dashboard",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen font-body">
        <main className="mx-auto max-w-md min-h-screen pb-24 px-4 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
