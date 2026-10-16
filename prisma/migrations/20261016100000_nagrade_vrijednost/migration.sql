-- Redoslijed nagrada po interno zadanoj vrijednosti, kao kod novčanih nagrada.
--
-- Postojeći turniri ostaju na RUCNO, pa im se dodjela ne mijenja. Vrijednost
-- je NULL dok je admin ne upiše; javno se nigdje ne prikazuje.

CREATE TYPE "PrizeOrder" AS ENUM ('RUCNO', 'VRIJEDNOST');
CREATE TYPE "PrizeTieRule" AS ENUM ('OPCE_PRIJE', 'POSEBNA_PRIJE');

ALTER TABLE "tournaments"
  ADD COLUMN "nagradeRedoslijed" "PrizeOrder" NOT NULL DEFAULT 'RUCNO',
  ADD COLUMN "nagradePravilo" "PrizeTieRule" NOT NULL DEFAULT 'OPCE_PRIJE';

ALTER TABLE "tournament_prizes" ADD COLUMN "vrijednost" INTEGER;
