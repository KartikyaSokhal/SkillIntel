-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Student',
    "currentRole" TEXT,
    "salary" INTEGER,
    "intent" TEXT,
    "location" TEXT,
    "organization" TEXT,
    "bio" TEXT,
    "headline" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "demandIndex" DOUBLE PRECISION,
    "salary" DOUBLE PRECISION,
    "growth" DOUBLE PRECISION,
    "experienceBarrier" TEXT,
    "saturationRisk" TEXT,
    "description" TEXT,
    "trendScore" DOUBLE PRECISION,
    "direction" "Direction",
    "percentChange" DOUBLE PRECISION,
    "jobCountCurrent" INTEGER,
    "jobCountPrevious" INTEGER,
    "githubScore" DOUBLE PRECISION,
    "stackoverflowScore" DOUBLE PRECISION,
    "googleTrendScore" DOUBLE PRECISION,
    "lastTrendComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedSkill" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RecommendedSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPath" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalDemand" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "RegionalDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTrend" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "jobCountCurrent" INTEGER NOT NULL DEFAULT 0,
    "jobCountPrevious" INTEGER NOT NULL DEFAULT 0,
    "githubScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stackoverflowScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "googleTrendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "direction" "Direction" NOT NULL DEFAULT 'STABLE',
    "percentChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "score" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestTech" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InterestTech_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestStrategic" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InterestStrategic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_profileId_key" ON "Resume"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_name_idx" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_trendScore_idx" ON "Skill"("trendScore");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_skillId_name_key" ON "Tag"("skillId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedSkill_skillId_name_key" ON "RecommendedSkill"("skillId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CareerPath_skillId_name_key" ON "CareerPath"("skillId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalDemand_skillId_city_key" ON "RegionalDemand"("skillId", "city");

-- CreateIndex
CREATE INDEX "SkillTrend_skillId_timestamp_idx" ON "SkillTrend"("skillId", "timestamp");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedSkill" ADD CONSTRAINT "RecommendedSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPath" ADD CONSTRAINT "CareerPath_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalDemand" ADD CONSTRAINT "RegionalDemand_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTrend" ADD CONSTRAINT "SkillTrend_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestTech" ADD CONSTRAINT "InterestTech_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestStrategic" ADD CONSTRAINT "InterestStrategic_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
