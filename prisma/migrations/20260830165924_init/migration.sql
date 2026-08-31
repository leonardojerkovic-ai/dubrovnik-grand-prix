-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN', 'GP_MANAGER');

-- CreateEnum
CREATE TYPE "Title" AS ENUM ('GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM', 'MK', 'I', 'II', 'III', 'IV', 'V', 'NONE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "SystemType" AS ENUM ('GP', 'AKADEMIJA');

-- CreateEnum
CREATE TYPE "TournamentLevel" AS ENUM ('KLUPSKA', 'NATJECATELJSKA', 'VRHUNSKA');

-- CreateEnum
CREATE TYPE "Tempo" AS ENUM ('STANDARD', 'RAPID', 'BLITZ');

-- CreateEnum
CREATE TYPE "RatingType" AS ENUM ('STANDARD', 'RAPID', 'BLITZ');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SWISS', 'ROUND_ROBIN');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('NAJAVA', 'PRIJAVE_OTVORENE', 'U_TIJEKU', 'ZAVRSEN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PRIJAVLJEN', 'OTKAZAN', 'NA_CEKANJU');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PRAVILNIK', 'ZAPISNIK', 'OSTALO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fideId" TEXT,
    "title" "Title" NOT NULL DEFAULT 'NONE',
    "gender" "Gender" NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "birthDate" TIMESTAMP(3),
    "isClubMember" BOOLEAN NOT NULL DEFAULT false,
    "memberSince" TIMESTAMP(3),
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_ratings_current" (
    "playerId" TEXT NOT NULL,
    "standard" INTEGER,
    "rapid" INTEGER,
    "blitz" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_ratings_current_pkey" PRIMARY KEY ("playerId")
);

-- CreateTable
CREATE TABLE "player_rating_snapshots" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ratingType" "RatingType" NOT NULL,
    "ratingValue" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_rating_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "system" "SystemType" NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "rounds" INTEGER NOT NULL,
    "level" "TournamentLevel",
    "tempo" "Tempo" NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isJuniorFinal" BOOLEAN NOT NULL DEFAULT false,
    "restrictedCategories" JSONB,
    "status" "TournamentStatus" NOT NULL DEFAULT 'NAJAVA',
    "minPlayersMet" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_results" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "gamesPlayed" BOOLEAN NOT NULL DEFAULT true,
    "ratingSnapshotUsed" INTEGER,
    "ratingOverridden" BOOLEAN NOT NULL DEFAULT false,
    "gpPoints" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_registrations" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PRIJAVLJEN',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings_categories" (
    "id" TEXT NOT NULL,
    "system" "SystemType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "standings_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_category_memberships" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,

    CONSTRAINT "player_category_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "seasonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT,
    "seasonId" TEXT,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_of_fame" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "pointsTotal" INTEGER NOT NULL,

    CONSTRAINT "hall_of_fame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "players_fideId_key" ON "players"("fideId");

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");

-- CreateIndex
CREATE INDEX "players_lastName_firstName_idx" ON "players"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "player_rating_snapshots_playerId_ratingType_snapshotDate_idx" ON "player_rating_snapshots"("playerId", "ratingType", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_system_yearLabel_key" ON "seasons"("system", "yearLabel");

-- CreateIndex
CREATE INDEX "tournaments_seasonId_date_idx" ON "tournaments"("seasonId", "date");

-- CreateIndex
CREATE INDEX "tournament_results_playerId_idx" ON "tournament_results"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_results_tournamentId_playerId_key" ON "tournament_results"("tournamentId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_registrations_tournamentId_playerId_key" ON "tournament_registrations"("tournamentId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "standings_categories_system_code_key" ON "standings_categories"("system", "code");

-- CreateIndex
CREATE UNIQUE INDEX "player_category_memberships_playerId_tournamentId_categoryC_key" ON "player_category_memberships"("playerId", "tournamentId", "categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "hall_of_fame_seasonId_categoryCode_place_key" ON "hall_of_fame"("seasonId", "categoryCode", "place");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings_current" ADD CONSTRAINT "player_ratings_current_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_rating_snapshots" ADD CONSTRAINT "player_rating_snapshots_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_category_memberships" ADD CONSTRAINT "player_category_memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_of_fame" ADD CONSTRAINT "hall_of_fame_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_of_fame" ADD CONSTRAINT "hall_of_fame_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
