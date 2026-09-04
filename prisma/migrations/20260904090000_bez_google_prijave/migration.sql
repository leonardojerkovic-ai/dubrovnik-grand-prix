-- Uklanjanje Google prijave.
--
-- Bila je nedovršena (adapteru su nedostajale tablice Account, Session i
-- VerificationToken), a i da je proradila, zaobišla bi tri stvari koje
-- registracija obavlja: godište i spol, zapis privole, i pristupni kod
-- kojim se račun povezuje s igračkim profilom.

-- Lozinka postaje obavezna. Bila je neobavezna samo zbog mogućnosti da se
-- netko prijavljuje isključivo Googleom.
DO $$
DECLARE bez_lozinke INT;
BEGIN
    SELECT count(*) INTO bez_lozinke
    FROM "users" WHERE "passwordHash" IS NULL;

    IF bez_lozinke > 0 THEN
        RAISE EXCEPTION
            'Migracija zaustavljena: % korisnika nema postavljenu lozinku. Vjerojatno su se prijavljivali Googleom. Prije nastavka im pošaljite poveznicu za postavljanje lozinke ili obrišite te račune.',
            bez_lozinke;
    END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;

DROP INDEX IF EXISTS "users_googleId_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "googleId";
