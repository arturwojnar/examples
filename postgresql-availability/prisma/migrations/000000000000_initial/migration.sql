SET TIME ZONE 'UTC';
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
    "date_range" tsrange,
    "deleted" BOOLEAN,
    CONSTRAINT "timeslot3_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "timeslot3"
ADD CONSTRAINT "timeslot3_excl" EXCLUDE USING GIST 
(
    "resourceid" WITH =, 
    "date_range" WITH && 
) WHERE ("deleted" IS FALSE);

CREATE UNIQUE INDEX "TimeSlot3_resourceId_daterange_deleted"
	ON "timeslot3"("requesterid", "resourceid", "date_range", "deleted");
CREATE INDEX "TimeSlot3_deleted"
	ON "timeslot3"("deleted" DESC);

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
CREATE UNIQUE INDEX "TimeSlot_resourceId_startTime_locked_key" ON "TimeSlot"("resourceId", "startTime", "locked");

-- CreateIndex
CREATE INDEX "TimeSlot2_resourceId_requesterId_idx" ON "TimeSlot2"("resourceId", "requesterId");

-- CreateIndex
CREATE INDEX "TimeSlot2_resourceId_idx" ON "TimeSlot2"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot2_requesterId_dates_deleted_idx" ON "TimeSlot2"("resourceId",  "startTime", "endTime", "deleted");

-- upsert_timeslots
CREATE OR REPLACE FUNCTION upsert_timeslots(slots JSONB)
RETURNS VOID AS $$
DECLARE
    slot JSONB;
    v_locked BOOLEAN;
BEGIN
    FOR slot IN SELECT * FROM jsonb_array_elements(slots)
    LOOP
        INSERT INTO "TimeSlot" ("requesterId", "resourceId", "startTime", "endTime", "locked")
        VALUES (slot->>0, (slot->>1)::INTEGER, (slot->>2)::TIMESTAMPTZ, (slot->>3)::TIMESTAMPTZ, True)
        ON CONFLICT ("resourceId", "startTime")
        DO UPDATE SET "startTime" = EXCLUDED."startTime",
            "endTime" = EXCLUDED."endTime",
            "requesterId" = EXCLUDED."requesterId",
            "locked" = True
        WHERE "TimeSlot"."locked" = False
        RETURNING "TimeSlot"."locked" INTO v_locked;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CONFLICT';
        END IF;
    END LOOP;
END $$ LANGUAGE plpgsql;

-- upsert_select_reservation
CREATE OR REPLACE FUNCTION upsert_select_reservation(
    p_requester_id TEXT,
    p_resource_id INTEGER,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check for an existing timeslot that conflicts with the provided time range
    SELECT 1 INTO v_count
    FROM "TimeSlot2" t
    WHERE t."resourceId" = p_resource_id
      AND t."startTime" < p_end_time
      AND t."endTime" > p_start_time
      AND t."deleted" = FALSE
    LIMIT 1
    FOR UPDATE;

    -- If a conflicting timeslot is found, raise an exception
    IF FOUND THEN
        RAISE EXCEPTION 'CONFLICT on %-% (%)', p_start_time, p_end_time, p_resource_id;
    END IF;

    -- If no conflicts, insert the new timeslot
    INSERT INTO "TimeSlot2" ("requesterId", "resourceId", "startTime", "endTime", "deleted")
    VALUES (p_requester_id, p_resource_id, p_start_time, p_end_time, FALSE);
END;
$$ LANGUAGE plpgsql;