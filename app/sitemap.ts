import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const STATIC_PAGES = [
  "",
  "o-nama",
  "faq",
  "kalendar",
  "najave",
  "prijave",
  "dokumenti",
  "postani-clan",
  "hall-of-fame",
  "privatnost",
  "ljestvice/opci-gp",
  "ljestvice/zene",
  "ljestvice/u20",
  "ljestvice/u16",
  "ljestvice/u12",
  "ljestvice/s50",
  "ljestvice/s65",
  "ljestvice/u1800",
  "ljestvice/akademija",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://dubrovnik-grand-prix.vercel.app";

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: new Date(),
  }));

  const tournaments = await prisma.tournament.findMany({
    select: { id: true, date: true },
  });

  const tournamentEntries: MetadataRoute.Sitemap = tournaments.map((t) => ({
    url: `${baseUrl}/turniri/${t.id}`,
    lastModified: t.date,
  }));

  return [...staticEntries, ...tournamentEntries];
}
