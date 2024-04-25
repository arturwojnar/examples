-- CreateTable
CREATE TABLE "TimeSlot2" (
    "id" SERIAL NOT NULL,
    "requesterId" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeSlot2_resourceId_idx" ON "TimeSlot2"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot2_resourceId_startTime_key" ON "TimeSlot2"("resourceId", "startTime");
