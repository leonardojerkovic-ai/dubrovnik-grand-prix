-- Medalje GP-a Akademije (čl. 19).
-- Migracija je isključivo aditivna: dodaje novi tip i novu tablicu, ne dira
-- nijedan postojeći stupac. Zato je redoslijed u odnosu na deploy koda
-- nevažan i može se primijeniti prije ili poslije njega.

-- CreateEnum
CREATE TYPE "MedalCategory" AS ENUM ('UKUPNO', 'U12', 'U10', 'U08', 'ZENE');

-- CreateTable
CREATE TABLE "medals" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "playerId" TEXT NOT NULL,
    "category" "MedalCategory" NOT NULL,
    "place" INTEGER NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medals_seasonId_idx" ON "medals"("seasonId");
CREATE INDEX "medals_playerId_idx" ON "medals"("playerId");
CREATE INDEX "medals_tournamentId_idx" ON "medals"("tournamentId");

-- Parcijalni jedinstveni indeksi.
-- Prisma ih ne može opisati jer uvjet ovisi o NULL vrijednosti stupca
-- tournamentId, a Postgres dva NULL-a smatra različitima — obično
-- @@unique zato ovdje ne bi štitio ništa.

-- Turnir: jedno mjesto u jednoj kategoriji pripada jednom igraču.
CREATE UNIQUE INDEX "medals_tournament_category_place_key"
    ON "medals"("tournamentId", "category", "place")
    WHERE "tournamentId" IS NOT NULL;

-- Turnir: jedan igrač, najviše jedna medalja (čl. 19 st. 4).
CREATE UNIQUE INDEX "medals_tournament_player_key"
    ON "medals"("tournamentId", "playerId")
    WHERE "tournamentId" IS NOT NULL;

-- Konačni poredak sezone: isto, samo vezano uz sezonu.
CREATE UNIQUE INDEX "medals_season_category_place_key"
    ON "medals"("seasonId", "category", "place")
    WHERE "tournamentId" IS NULL;

CREATE UNIQUE INDEX "medals_season_player_key"
    ON "medals"("seasonId", "playerId")
    WHERE "tournamentId" IS NULL;

-- AddForeignKey
ALTER TABLE "medals" ADD CONSTRAINT "medals_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "seasons"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medals" ADD CONSTRAINT "medals_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medals" ADD CONSTRAINT "medals_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
