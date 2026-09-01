-- Verzija pravilnika po sezoni (čl. 30 GP / čl. 23 Akademije)
ALTER TABLE "seasons" ADD COLUMN "rulebookVersion" TEXT;

-- Snapshot izračuna uz svaki rezultat: faktori, N, R, omjer, verzija
ALTER TABLE "tournament_results" ADD COLUMN "scoringSnapshot" JSONB;

-- Zaključano pravo na bodove u GP-u Akademije (čl. 3)
CREATE TABLE "academy_eligibility" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "firstTournamentId" TEXT,
    "firstTournamentDate" TIMESTAMP(3) NOT NULL,
    "rapidRatingAtFirst" INTEGER,
    "birthDateUsed" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_eligibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "academy_eligibility_seasonId_playerId_key"
    ON "academy_eligibility"("seasonId", "playerId");

CREATE INDEX "academy_eligibility_playerId_idx"
    ON "academy_eligibility"("playerId");

ALTER TABLE "academy_eligibility" ADD CONSTRAINT "academy_eligibility_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "academy_eligibility" ADD CONSTRAINT "academy_eligibility_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "academy_eligibility" ADD CONSTRAINT "academy_eligibility_firstTournamentId_fkey"
    FOREIGN KEY ("firstTournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- VAŽNO: nove tablice ne nasljeđuju RLS. Bez ovoga bi academy_eligibility
-- ostala otvorena prema Supabase REST API-ju, za razliku od svih ostalih.
ALTER TABLE "academy_eligibility" ENABLE ROW LEVEL SECURITY;
