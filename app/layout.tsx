import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Dubrovnik Grand Prix — ŠK Dubrovnik",
  description:
    "Službene ljestvice, turniri i rezultati šahovskog kluba ŠK Dubrovnik.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
