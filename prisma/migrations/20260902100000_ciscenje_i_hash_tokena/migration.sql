-- 1. Uklanjanje neiskorištenih tablica.
--    Obje su prazne i kod ih nikad nije koristio. Kategorije se računaju u
--    lib/scoring/gp/categories.ts, a snapshot pripadnosti nije potreban jer
--    dobne kategorije ovise samo o godištu i godini sezone (nepromjenjivo),
--    a U1800 o rejtingu zabilježenom uz rezultat turnira.
DROP TABLE IF EXISTS "player_category_memberships";
DROP TABLE IF EXISTS "standings_categories";

-- 2. Tokeni za reset lozinke spremaju se kao SHA-256 hash.
--    Tablica je prazna, pa nema migracije podataka. Eventualne poveznice
--    poslane prije ove promjene prestaju vrijediti — korisnik zatraži novu.
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_token_key";
DROP INDEX IF EXISTS "password_reset_tokens_token_key";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "token" TO "tokenHash";
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key"
    ON "password_reset_tokens"("tokenHash");

-- 3. Indeksi na strane ključeve bez pokrivenosti.
CREATE INDEX "announcements_tournamentId_idx" ON "announcements"("tournamentId");
CREATE INDEX "announcements_seasonId_idx" ON "announcements"("seasonId");
CREATE INDEX "documents_seasonId_idx" ON "documents"("seasonId");
CREATE INDEX "hall_of_fame_playerId_idx" ON "hall_of_fame"("playerId");
CREATE INDEX "tournament_registrations_playerId_idx" ON "tournament_registrations"("playerId");
CREATE INDEX "academy_eligibility_firstTournamentId_idx" ON "academy_eligibility"("firstTournamentId");
