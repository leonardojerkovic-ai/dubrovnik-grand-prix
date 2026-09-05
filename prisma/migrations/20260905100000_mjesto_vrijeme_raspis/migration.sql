-- Mjesto održavanja, vrijeme početka i poveznica na raspis.
--
-- Vrijeme je tekst "HH:MM", a ne datum s vremenom: stupac `date` koristi se
-- kao DAN na više mjesta (usporedbe članstva po čl. 4, cjelodnevni događaji
-- u iCal kalendaru), pa bi mu dodavanje sata unijelo vremenske zone ondje
-- gdje ih dosad nije bilo.
ALTER TABLE "tournaments" ADD COLUMN "venue" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "startTime" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "announcementUrl" TEXT;
