-- Poništavanje sesija pri promjeni lozinke.
--
-- Sesija je JWT i traje 30 dana. Promjena lozinke dosad nije odjavljivala
-- nikoga: tko je sesiju preuzeo, ostajao je unutra i nakon što mu je žrtva
-- promijenila lozinku. Upisani trenutak poništava sve tokene izdane prije
-- njega (vidi jwt callback u lib/auth.ts).
ALTER TABLE "users" ADD COLUMN "sessionsValidFrom" TIMESTAMP(3);
