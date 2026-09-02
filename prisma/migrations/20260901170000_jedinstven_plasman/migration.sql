-- Jedinstvenost plasmana unutar turnira (čl. 10 Akademije).
--
-- Prije stvaranja indeksa provjeravamo postoje li već dvostruki plasmani.
-- Bez ove provjere Postgres bi javio šturu grešku o duplikatu, a ne bi se
-- vidjelo NA KOJEM turniru i KOJI plasman treba ispraviti.
DO $$
DECLARE
    dup RECORD;
    dup_list TEXT := '';
    dup_count INT := 0;
BEGIN
    FOR dup IN
        SELECT tr."tournamentId", t."name" AS tournament_name, tr."rank",
               count(*) AS broj
        FROM "tournament_results" tr
        JOIN "tournaments" t ON t."id" = tr."tournamentId"
        GROUP BY tr."tournamentId", t."name", tr."rank"
        HAVING count(*) > 1
        ORDER BY t."name", tr."rank"
    LOOP
        dup_count := dup_count + 1;
        dup_list := dup_list || format('  turnir "%s", plasman %s (%s puta)%s',
                                       dup.tournament_name, dup.rank, dup.broj, chr(10));
    END LOOP;

    IF dup_count > 0 THEN
        RAISE EXCEPTION
            'Migracija zaustavljena: pronađeno % dvostrukih plasmana.%sIspravite ih u adminu pa ponovite migraciju:%s%s',
            dup_count, chr(10), chr(10), dup_list;
    END IF;
END $$;

CREATE UNIQUE INDEX "tournament_results_tournamentId_rank_key"
    ON "tournament_results"("tournamentId", "rank");
