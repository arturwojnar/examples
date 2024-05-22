-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "requesterId" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot2" (
    "id" SERIAL NOT NULL,
    "requesterId" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TimeSlot2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE "timeslot3" (
    "id" SERIAL NOT NULL,
    "requesterid" TEXT,
    "resourceid" INTEGER,
    "date_range" daterange,
    "deleted" BOOLEAN,
    CONSTRAINT "timeslot3_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "timeslot3"
ADD CONSTRAINT "timeslot3_excl" EXCLUDE USING GIST 
(
    "resourceid" WITH =, 
    "date_range" WITH && 
) WHERE ("deleted" IS FALSE);

-- CreateTable
CREATE TABLE "v_count" (
    "count" INTEGER
);

-- CreateIndex
CREATE INDEX "TimeSlot_resourceId_requesterId_idx" ON "TimeSlot"("resourceId", "requesterId");

-- CreateIndex
CREATE INDEX "TimeSlot_resourceId_idx" ON "TimeSlot"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_resourceId_startTime_key" ON "TimeSlot"("resourceId", "startTime");

-- CreateIndex
CREATE INDEX "TimeSlot2_resourceId_requesterId_idx" ON "TimeSlot2"("resourceId", "requesterId");

-- CreateIndex
CREATE INDEX "TimeSlot2_resourceId_idx" ON "TimeSlot2"("resourceId");

