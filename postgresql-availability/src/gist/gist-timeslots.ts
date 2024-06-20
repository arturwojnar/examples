/* ---------- TimeSlot ---------- */
import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import postgres from 'postgres'

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
  private _sql: postgres.Sql<Record<string, postgres.PostgresType>>

  constructor(
    private _prisma = prisma,
    private _port: number,
  ) {
    this._sql = postgres({
      host: 'localhost',
      port: this._port,
      database: 'test',
      username: 'test',
      password: 'test',
    })
  }

  async create({ requesterId, resourceId, date_range }: TimeSlot) {
    await this._sql`
      INSERT INTO "timeslot3" ("requesterid", "resourceid", "date_range", "deleted")
      VALUES (
        ${requesterId}::text,
        ${resourceId}::int,
        tsrange(${date_range[0].toISOString()}, ${date_range[1].toISOString()}, '[)'),
        False
      )
    `
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

  async unlock(requesterid: string, resourceid: number, startTime?: Date, endTime?: Date) {
    if (startTime && endTime) {
      await this._sql`
        UPDATE "timeslot3"
        SET "deleted"=True
        WHERE 
          "requesterid"=${requesterid}::text AND
          "resourceid"=${resourceid}::int AND
          "date_range"=tsrange(${startTime.toISOString()}::timestamp, ${endTime.toISOString()}::timestamp, '[)') AND
          "deleted"=False
      `
    } else {
      await this._sql`
        UPDATE "timeslot3"
        SET "deleted"=True
        WHERE "requesterid"=${requesterid}::text AND
        "resourceid"=${resourceid}::int AND
        "deleted"=False
      `
    }
  }
}
