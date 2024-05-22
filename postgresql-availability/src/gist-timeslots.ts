/* ---------- TimeSlot ---------- */
import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

export class TimeSlot {
  constructor(
    public date_range: [Date, Date],
    public resourceId: number,
    public requesterId: string,
    public id?: number,
    public deleted = false,
  ) {}

  isOverlapping(from: Date, to: Date): boolean {
    // Check if there is any overlap between [from, to] and the time slot
    return dayjs(from).isBefore(this.date_range[1]) && dayjs(to).isAfter(this.date_range[0])
  }

  canBeUnlockedBy(requesterId: string): boolean {
    return this.requesterId === requesterId
  }

  getData() {
    return {
      date_range: this.date_range,
      resourceId: this.resourceId,
      requesterId: this.requesterId,
      id: this.id,
      deleted: this.deleted,
    }
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  Lock(requesterId: string, from: Date, to: Date) {
    return new TimeSlot([from, to], this.resourceId, requesterId)
  }
}

/* ---------- TimeSlotRepository ---------- */
export class TimeSlotRepository {
  constructor(private _prisma = prisma) {}

  async create({ requesterId, resourceId, date_range }: TimeSlot) {
    await this._prisma.$executeRawUnsafe(`
      INSERT INTO "timeslot3" (requesterId, resourceId, date_range, deleted) VALUES ('${requesterId}', ${resourceId}, daterange('${date_range[0].toISOString()}', '${date_range[1].toISOString()}', '[]'), False)
    `)
  }

  async find(resourceid: number): Promise<TimeSlot[]> {
    const prismaTimeSlots: Array<{
      date_range: [Date, Date]
      resourceid: number
      requesterid: string
      id: number
      deleted: boolean
    }> = await this._prisma.$queryRawUnsafe(`
      SELECT "id", "requesterid", "resourceid", "date_range"::text, "deleted" FROM "timeslot3" WHERE "resourceid"=${resourceid}
    `)
    return prismaTimeSlots.map(
      (slot) => new TimeSlot([new Date(), new Date()], slot.resourceid, slot.requesterid, slot.id, slot.deleted),
    )
  }

  async unlock(requesterid: string, resourceid: number) {
    return await this._prisma.timeslot3.updateMany({
      where: {
        requesterid,
        resourceid,
      },
      data: {
        deleted: true,
      },
    })
  }
}
