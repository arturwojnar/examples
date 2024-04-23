/*
  Warnings:

  - A unique constraint covering the columns `[resourceId,startTime]` on the table `TimeSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "resourceId_startTime_idx";

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_resourceId_startTime_key" ON "TimeSlot"("resourceId", "startTime");
