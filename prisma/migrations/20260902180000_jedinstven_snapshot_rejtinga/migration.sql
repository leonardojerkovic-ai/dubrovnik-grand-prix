-- Jedan zapis rejtinga po igraču, tempu i danu.
-- Bez ovoga bi ponovljeni uvoz (ili dva klika na "Spremi") stvorio duplikate
-- koji bi iskrivili krivulju rejtinga na profilu igrača.

-- Postojeći zapisi imaju vrijeme unosa, pa se normaliziraju na ponoć.
UPDATE "player_rating_snapshots"
SET "snapshotDate" = date_trunc('day', "snapshotDate");

-- Ako je normalizacija stvorila duplikate, zadrži najnoviji zapis.
DELETE FROM "player_rating_snapshots" a
USING "player_rating_snapshots" b
WHERE a."playerId" = b."playerId"
  AND a."ratingType" = b."ratingType"
  AND a."snapshotDate" = b."snapshotDate"
  AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX "player_rating_snapshots_playerId_ratingType_snapshotDate_key"
    ON "player_rating_snapshots"("playerId", "ratingType", "snapshotDate");
