-- Ograničava li turnir Akademije pravo NASTUPA na igrače koji zadovoljavaju
-- čl. 3 (godište G−14 i mlađi, rapid ispod 1600).
--
-- Čl. 3 govori o pravu na bodove, a čl. 6 nastup prepušta uvjetima raspisa,
-- pa ovo nije pravilo pravilnika nego postavka po turniru. Zadano uključeno
-- jer je to ono što klub gotovo uvijek želi.
ALTER TABLE "tournaments"
    ADD COLUMN "academyPointsOnly" BOOLEAN NOT NULL DEFAULT true;
