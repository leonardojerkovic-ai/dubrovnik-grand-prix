import type { Metadata } from "next";
import {
  Inter,
  Space_Grotesk,
  Fraunces,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["500", "700"],
});

/**
 * Serif SAMO za naslov na naslovnici. Namjerno se ne koristi drugdje —
 * jedan istaknuti natpis nosi identitet, a serif kroz cijelu stranicu
 * učinio bi je težom za čitanje i manje dosljednom s ostatkom sučelja.
 */
const hero = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hero",
  weight: ["400", "600"],
  style: ["normal", "italic"],
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
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "https://dubrovnik-grand-prix.vercel.app"
  ),
  title: {
    default: "Dubrovnik Grand Prix — ŠK Dubrovnik",
    template: "%s — Dubrovnik Grand Prix",
  },
  description:
    "Službene ljestvice, turniri i rezultati šahovskog kluba ŠK Dubrovnik.",
  openGraph: {
    title: "Dubrovnik Grand Prix — ŠK Dubrovnik",
    description:
      "Službene ljestvice, turniri i rezultati šahovskog kluba ŠK Dubrovnik.",
    siteName: "Dubrovnik Grand Prix",
    locale: "hr_HR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dubrovnik Grand Prix — ŠK Dubrovnik",
    description:
      "Službene ljestvice, turniri i rezultati šahovskog kluba ŠK Dubrovnik.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr" className={`${display.variable} ${hero.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Providers>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </Providers>
      </body>
    </html>
  );
}
