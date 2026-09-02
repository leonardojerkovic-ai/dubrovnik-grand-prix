-- Samostalna registracija više ne spaja račun s postojećim igračkim profilom
-- automatski. Ime, prezime i godište javno su dostupni na FIDE stranicama,
-- pa je automatsko spajanje omogućavalo preuzimanje tuđeg profila.
ALTER TABLE "users" ADD COLUMN "needsPlayerLink" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "pendingPlayerId" TEXT;
ALTER TABLE "users" ADD COLUMN "claimedName" TEXT;
ALTER TABLE "users" ADD COLUMN "claimedBirthYear" INTEGER;

CREATE INDEX "users_needsPlayerLink_idx" ON "users"("needsPlayerLink");
