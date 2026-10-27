-- Ograničenje broja prijava i lista čekanja.
--
-- NULL znači bez ograničenja, pa svi postojeći turniri ostaju kakvi jesu.
-- Status NA_CEKANJU već postoji u enumu RegistrationStatus od početka;
-- ovo je prvi put da ga išta koristi, pa se enum ne dira.
ALTER TABLE "tournaments" ADD COLUMN "maxPlayers" INTEGER;
