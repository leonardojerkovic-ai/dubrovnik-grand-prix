-- Pristupni kod kojim igrač sam poveže svoj račun s igračkim profilom.
--
-- Bez njega administrator mora ručno odobriti svaku vezu; pri stotinjak
-- članova to je posao koji se ne isplati. Kod dokazuje identitet, pa
-- odobrenje više ne treba.
--
-- Sprema se samo otisak koda (SHA-256), nikad sam kod: procurjeli redak
-- baze tako nikome ne omogućuje preuzimanje tuđeg profila.
ALTER TABLE "players" ADD COLUMN "linkCodeHash" TEXT;
ALTER TABLE "players" ADD COLUMN "linkCodeIssuedAt" TIMESTAMP(3);
ALTER TABLE "players" ADD COLUMN "linkCodeUsedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "players_linkCodeHash_key" ON "players"("linkCodeHash");
