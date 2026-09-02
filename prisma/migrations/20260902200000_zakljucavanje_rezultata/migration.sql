-- Rok za prigovor i zaključavanje rezultata (čl. 29 GP / čl. 22 Akademije).
--
-- Zaključavanje se izvodi iz datuma objave, ne sprema kao zastavica: zastavica
-- bi se morala negdje prebacivati i mogla bi se razići sa stvarnim protekom
-- roka. Zato su polja na turniru, a stanje se računa u trenutku upita.

ALTER TABLE "tournaments" ADD COLUMN "resultsPublishedAt" TIMESTAMP(3);
ALTER TABLE "tournaments" ADD COLUMN "unlockedUntil" TIMESTAMP(3);
ALTER TABLE "tournaments" ADD COLUMN "unlockReason" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "unlockedByEmail" TEXT;

-- Turnirima koji već imaju unesene rezultate postavlja se datum objave na
-- vrijeme zadnje izmjene rezultata, da rok za prigovor ne krene ispočetka.
UPDATE "tournaments" t
SET "resultsPublishedAt" = sub.last_update
FROM (
    SELECT "tournamentId", max("updatedAt") AS last_update
    FROM "tournament_results"
    GROUP BY "tournamentId"
) sub
WHERE t."id" = sub."tournamentId";

-- Neiskorištena polja po rezultatu — zaključavanje je svojstvo turnira,
-- rezultati se objavljuju i postaju konačni zajedno.
ALTER TABLE "tournament_results" DROP COLUMN "isLocked";
ALTER TABLE "tournament_results" DROP COLUMN "lockedAt";
