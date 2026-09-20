-- Row Level Security na tablicama medalja i nagrada.
--
-- Sve ostale tablice u shemi imaju RLS uključen bez ijedne politike, što u
-- Postgresu znači potpunu zabranu za sve role osim vlasnika. Aplikacija se
-- spaja Prismom preko DATABASE_URL, dakle kao vlasnik, pa RLS na nju ne
-- utječe — ali javni Supabase ključevi time ne mogu čitati ni pisati ništa.
--
-- Tri tablice dodane u rujnu 2026. ispale su iz tog pravila jer ih je
-- stvorila Prisma migracija, a ne Supabaseov editor koji RLS uključuje sam.
-- Dok je tako, jedino su one dostupne svakome tko dođe do javnog ključa.
-- Ovo ih izjednačava s ostatkom sheme.

ALTER TABLE "medals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_prizes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_prize_awards" ENABLE ROW LEVEL SECURITY;
