-- Dob se svugdje veže uz GODIŠTE, ne uz točan datum rođenja.
--
-- Čl. 3 Akademije mijenja se s "nije navršio 14 godina do 1. siječnja" na
-- "godište G−14 ili mlađe", čime Akademija koristi isto načelo kao GP
-- (čl. 22). Razlika u praksi postoji samo za igrače rođene točno 1. siječnja.
--
-- Uz to klub više ne čuva točne datume rođenja djece, što je i manje
-- osobnih podataka nego što je potrebno za odluke koje sustav donosi.

ALTER TABLE "academy_eligibility" DROP COLUMN "birthDateUsed";
ALTER TABLE "academy_eligibility" ADD COLUMN "birthYearUsed" INTEGER;

ALTER TABLE "players" DROP COLUMN "birthDate";
