-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resourceId_startTime_idx" ON "TimeSlot"("resourceId", "startTime");
