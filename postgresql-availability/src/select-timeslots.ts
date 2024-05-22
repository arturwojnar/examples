import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'

export class TimeSlot {
  constructor(
    public resourceId: number,
    public startTime: Date,
    public endTime: Date,
    public requesterId: string,
    public id?: number,
    public deleted = false,
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
      deleted: this.deleted,
    }
  }
}

/* ---------- TimeSlotRepository ---------- */
export class TimeSlotRepository {
  constructor(private _prisma = prisma) {}

  async create({ requesterId, resourceId, startTime: from, endTime: to }: TimeSlot) {
    await this._prisma.$transaction(async (prisma) => {
      return await prisma.$executeRawUnsafe(
        `
        DO $$
        DECLARE
          v_count INTEGER;
        BEGIN
          SELECT 1 AS "count"
          INTO v_count
          FROM "TimeSlot2" t
          WHERE "t"."resourceId"=${resourceId}
            AND "t"."startTime" < '${to.toISOString()}'
            AND "t"."endTime" > '${from.toISOString()}'
            AND "t"."deleted"=False
          LIMIT 1
          FOR UPDATE;
        
          IF FOUND THEN
            RAISE EXCEPTION 'CONFLICT';
          END IF;
        
          INSERT INTO "TimeSlot2" ("requesterId", "resourceId", "startTime", "endTime", "deleted")
          VALUES ('${requesterId}', ${resourceId}, '${from.toISOString()}', '${to.toISOString()}', False);
        
        END $$;
        `,
      )
    })
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    const prismaTimeSlots = await this._prisma.timeSlot2.findMany({
      where: { resourceId },
    })
    return prismaTimeSlots.map(
      (slot) => new TimeSlot(slot.resourceId, slot.startTime, slot.endTime, slot.requesterId, slot.id, slot.deleted),
    )
  }

  async unlock(resourceId: number, requesterId: string) {
    return await this._prisma.timeSlot2.updateMany({
      where: {
        requesterId,
        resourceId,
      },
      data: {
        deleted: true,
      },
    })
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  async lock(requesterId: string, from: Date, to: Date) {
    return new TimeSlot(this.resourceId, from, to, requesterId)
  }
}
