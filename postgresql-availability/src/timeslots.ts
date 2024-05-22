import { Prisma, PrismaClient } from '@prisma/client'
import pLimit from 'p-limit'

const prisma = new PrismaClient()

/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'
import { DefaultArgs } from '@prisma/client/runtime/library'

export class TimeSlot {
  constructor(
    public startTime: Date,
    public endTime: Date,
    public resourceId: number,
    public requesterId: string,
    public id?: number,
    public locked: boolean = true,
  ) {}

  isOverlapping(from: Date, to: Date): boolean {
    // Check if there is any overlap between [from, to] and the time slot
    return dayjs(from).isBefore(this.endTime) && dayjs(to).isAfter(this.startTime)
  }

  canBeUnlockedBy(requesterId: string): boolean {
    return this.requesterId === requesterId
  }

  getData() {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      resourceId: this.resourceId,
      requesterId: this.requesterId,
      id: this.id,
    }
  }
}

/* ---------- TimeSlotRepository ---------- */
export class TimeSlotRepository {
  constructor(private _prisma = prisma) {}

  async create(
    slot: TimeSlot,
    tx: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    > = this._prisma,
  ) {
    return await tx.$queryRawUnsafe(`
      DO $$
      DECLARE
          v_locked BOOLEAN;
      BEGIN
          INSERT INTO "TimeSlot" ("requesterId", "resourceId", "startTime", "endTime", "locked")
          VALUES ('${slot.requesterId}', ${slot.resourceId}, '${slot.startTime.toISOString()}', '${slot.endTime.toISOString()}', True)
          ON CONFLICT ("resourceId", "startTime")
          DO UPDATE SET "startTime" = EXCLUDED."startTime",
              "endTime" = EXCLUDED."endTime",
              "requesterId" = EXCLUDED."requesterId",
              "locked"=True
          WHERE "TimeSlot"."locked"=False
          RETURNING "TimeSlot"."locked" INTO v_locked;
      
          IF NOT FOUND THEN
              RAISE EXCEPTION 'CONFLICT';
          END IF;
      
      END $$;
    `)
  }

  async createMany(slots: TimeSlot[]) {
    return await this._prisma.$transaction(async (tx) => {
      const limit = pLimit(10)
      return await Promise.all(slots.map((slot) => limit(() => this.create(slot, tx))))
    })
  }

  async unlock(resourceId: number, requesterId: string) {
    return await this._prisma.timeSlot.updateMany({
      where: {
        resourceId,
        requesterId,
      },
      data: {
        locked: false,
      },
    })
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    const prismaTimeSlots = await this._prisma.timeSlot.findMany({
      where: { resourceId },
    })
    return prismaTimeSlots.map(
      (slot) => new TimeSlot(slot.startTime, slot.endTime, resourceId, slot.requesterId, slot.id, slot.locked),
    )
  }
}

/* ---------- TimeAvailability ---------- */
const TO_MINUTES = 60000

export class TimeAvailability {
  constructor(private resourceId: number) {}

  async lock(requesterId: string, from: Date, to: Date, timeSlotSize = 15) {
    // Calculate slots required
    if ((from.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }
    if ((to.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }

    const durationMinutes = (to.getTime() - from.getTime()) / TO_MINUTES
    const slotsRequired = Math.ceil(durationMinutes / timeSlotSize)

    // Generate and save new slots
    return Array(slotsRequired)
      .fill(0)
      .map((_, i) => {
        const startTime = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
        const endTime = new Date(startTime.getTime() + timeSlotSize * TO_MINUTES)
        return new TimeSlot(startTime, endTime, this.resourceId, requesterId)
      })
  }
}
