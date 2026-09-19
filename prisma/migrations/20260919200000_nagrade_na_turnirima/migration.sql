-- Nagrade na turnirima glavnog GP-a.
-- Aditivna migracija: dvije nove tablice, nijedan postojeći stupac se ne
-- dira, pa je redoslijed u odnosu na deploy koda nevažan.

-- CreateTable
CREATE TABLE "tournament_prizes" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "shortLabel" TEXT,
    "priority" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "gender" "Gender",
    "birthYearMin" INTEGER,
    "birthYearMax" INTEGER,
    "ratingMin" INTEGER,
    "ratingMax" INTEGER,
    "clubMembersOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_prize_awards" (
    "id" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_prize_awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_prizes_tournamentId_idx" ON "tournament_prizes"("tournamentId");

-- Isti prioritet dvaput učinio bi redoslijed obilaska nedeterminističnim,
-- a time i samu dodjelu.
CREATE UNIQUE INDEX "tournament_prizes_tournamentId_priority_key"
    ON "tournament_prizes"("tournamentId", "priority");

-- CreateIndex
CREATE INDEX "tournament_prize_awards_playerId_idx" ON "tournament_prize_awards"("playerId");
CREATE INDEX "tournament_prize_awards_tournamentId_idx" ON "tournament_prize_awards"("tournamentId");

CREATE UNIQUE INDEX "tournament_prize_awards_prizeId_place_key"
    ON "tournament_prize_awards"("prizeId", "place");

-- Nagrade se ne kumuliraju: jedan igrač, najviše jedna nagrada po turniru.
CREATE UNIQUE INDEX "tournament_prize_awards_tournamentId_playerId_key"
    ON "tournament_prize_awards"("tournamentId", "playerId");

-- AddForeignKey
ALTER TABLE "tournament_prizes" ADD CONSTRAINT "tournament_prizes_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_prize_awards" ADD CONSTRAINT "tournament_prize_awards_prizeId_fkey"
    FOREIGN KEY ("prizeId") REFERENCES "tournament_prizes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_prize_awards" ADD CONSTRAINT "tournament_prize_awards_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
