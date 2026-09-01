-- Datum prestanka članstva (dosad se izlazak iz kluba nije mogao zabilježiti)
ALTER TABLE "players" ADD COLUMN "memberUntil" TIMESTAMP(3);

-- Članstvo na dan turnira (čl. 4) — ljestvice odsad filtriraju po ovome
ALTER TABLE "tournament_results"
    ADD COLUMN "wasClubMember" BOOLEAN NOT NULL DEFAULT false;

-- Popunjavanje za već unesene rezultate, najbolje što se iz postojećih
-- podataka da zaključiti: član je onaj tko je danas označen kao član i čiji
-- datum učlanjenja nije kasniji od datuma turnira. Igračima bez upisanog
-- memberSince ne može se utvrditi raniji datum, pa se uzima trenutno stanje.
UPDATE "tournament_results" tr
SET "wasClubMember" = true
FROM "players" p, "tournaments" t
WHERE tr."playerId" = p."id"
  AND tr."tournamentId" = t."id"
  AND p."isClubMember" = true
  AND (p."memberSince" IS NULL OR p."memberSince" <= t."date");
