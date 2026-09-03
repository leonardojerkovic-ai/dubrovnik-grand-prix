-- Skrbništvo nad maloljetnim igračem.
--
-- Jedan roditelj često vodi dvoje ili troje djece, a tražiti tri odvojene
-- adrese e-pošte bilo bi besmisleno. Veza je odvojena od players.userId,
-- koji ostaje vlastiti profil vlasnika računa.
CREATE TABLE "guardian_links" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guardian_links_guardianUserId_playerId_key"
    ON "guardian_links"("guardianUserId", "playerId");
CREATE INDEX "guardian_links_playerId_idx" ON "guardian_links"("playerId");

ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardianUserId_fkey"
    FOREIGN KEY ("guardianUserId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "guardian_links" ENABLE ROW LEVEL SECURITY;
