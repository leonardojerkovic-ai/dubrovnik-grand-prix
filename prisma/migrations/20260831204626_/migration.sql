-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "baseMinutes" INTEGER,
ADD COLUMN     "incrementSeconds" INTEGER;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
