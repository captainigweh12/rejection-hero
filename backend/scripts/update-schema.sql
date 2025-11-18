-- Add isAdmin column to user table
ALTER TABLE "user" ADD COLUMN "isAdmin" INTEGER DEFAULT 0;

-- Add challengeDuration, questMode, notificationPreferences to profile table
ALTER TABLE "profile" ADD COLUMN "challengeDuration" INTEGER;
ALTER TABLE "profile" ADD COLUMN "questMode" TEXT DEFAULT 'QUEST_BY_QUEST';
ALTER TABLE "profile" ADD COLUMN "notificationPreferences" TEXT;

-- Add dailyConfidenceMeter and lastConfidenceDecayAt to user_stats table
ALTER TABLE "user_stats" ADD COLUMN "dailyConfidenceMeter" REAL DEFAULT 0;
ALTER TABLE "user_stats" ADD COLUMN "lastConfidenceDecayAt" DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add seriesId, seriesIndex, isSeriesQuest to user_quest table
ALTER TABLE "user_quest" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "user_quest" ADD COLUMN "seriesIndex" INTEGER;
ALTER TABLE "user_quest" ADD COLUMN "isSeriesQuest" INTEGER DEFAULT 0;

-- Add captainigweh12@gmail.com as admin
UPDATE "user" SET "isAdmin" = 1 WHERE "email" = 'captainigweh12@gmail.com';

