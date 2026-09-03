-- 1. Rezultati se više ne brišu zajedno s igračem.
--
-- Dosad je veza bila ON DELETE CASCADE, pa bi brisanje igrača tiho uklonilo
-- sve njegove rezultate. To ne šteti samo njemu: on je bio dio broja igrača
-- (N) iz kojega su računati bodovi svima ostalima, a njegovo mjesto
-- određivalo je njihove plasmane. Ostao bi turnir s rupom u poretku i
-- bodovima koji se više ne mogu provjeriti.
ALTER TABLE "tournament_results"
    DROP CONSTRAINT "tournament_results_playerId_fkey";

ALTER TABLE "tournament_results"
    ADD CONSTRAINT "tournament_results_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Preminuli igrači.
--
-- Uklanjaju se s popisa igrača i iz odabira za buduće turnire, ali njihovi
-- rezultati, ljestvice i Hall of Fame ostaju netaknuti.
ALTER TABLE "players" ADD COLUMN "deceased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "players" ADD COLUMN "deceasedYear" INTEGER;
