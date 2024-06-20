import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'
import postgres from 'postgres'
// import { DefaultArgs } from '@prisma/client/runtime/library'

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
      locked: this.locked,
    }
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

  async lock(slots: TimeSlot[]) {
    const values: Array<[string, number, Date, Date]> = slots.map((slot) => [
      slot.requesterId,
      slot.resourceId,
      slot.startTime,
      slot.endTime,
    ])
    const jsonString = JSON.stringify(
      values.map((slot) => [slot[0], slot[1], slot[2].toISOString(), slot[3].toISOString()]),
    )
    await this._sql.unsafe(`SELECT upsert_timeslots('${jsonString}'::jsonb)`)
  }

  async unlock(resourceId: number, requesterId: string, startTime?: Date, endTime?: Date) {
    if (startTime && endTime) {
      const startDates = Array((endTime.getTime() - startTime.getTime()) / (15 * 60000))
        .fill(0)
        .map((_, i) =>
          dayjs(startTime)
            .add(15 * i, 'minutes')
            .toISOString(),
        )
      const result = await this._sql.unsafe(`
          UPDATE "TimeSlot"
          SET "locked" = false
          WHERE "resourceId" = ${resourceId}
          AND "requesterId" = '${requesterId}'
          AND "startTime" IN (${startDates.map((date) => `'${date}'`).join(',')})
      `)
      return result.count
    } else {
      const result = await this._sql`
        UPDATE "TimeSlot"
        SET "locked" = false
        WHERE "resourceId" = ${resourceId}
        AND "requesterId" = ${requesterId}::text
      `
      return result.count
    }
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    //   const result = await this._sql<TimeSlot[]>`
    //   SELECT *
    //   FROM "TimeSlot"
    //   WHERE "resourceId" = ${resourceId}
    // `
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

  async getSlotsForDateRange(requesterId: string, from: Date, to: Date, timeSlotSize = 15) {
    // Calculate slots required
    if ((from.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }
    if ((to.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }

    const durationMinutes = (to.getTime() - from.getTime()) / TO_MINUTES
    const slotsRequired = Math.ceil(durationMinutes / timeSlotSize)

    // Generate slots
    return Array(slotsRequired)
      .fill(0)
      .map((_, i) => {
        const startTime = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
        const endTime = new Date(startTime.getTime() + timeSlotSize * TO_MINUTES)
        return new TimeSlot(startTime, endTime, this.resourceId, requesterId)
      })
  }
}
