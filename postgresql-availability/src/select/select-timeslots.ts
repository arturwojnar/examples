import { PrismaClient } from '@prisma/client'
import postgres from 'postgres'

const prisma = new PrismaClient()

export interface TimeSlot {
  requesterId: string
  resourceId: number
  startTime: Date
  endTime: Date
  deleted: boolean
}

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
  ) {
    this.startTime = new Date(startTime)
    this.endTime = new Date(endTime)
  }

  isOverlapping(from: Date, to: Date): boolean {
    // Check if there is any overlap between [from, to] and the time slot
    return dayjs(from).isBefore(this.endTime) && dayjs(to).isAfter(this.startTime)
  }

  canBeUnlockedBy(requesterId: string): boolean {
    return this.requesterId === requesterId
  }

  toJSON() {
    return {
      startTime: new Date(this.startTime),
      endTime: new Date(this.endTime),
      resourceId: this.resourceId,
      requesterId: this.requesterId,
      id: this.id,
      deleted: this.deleted,
    }
  }

  static fromDatabase(row: TimeSlot): TimeSlot {
    return new TimeSlot(
      row.resourceId,
      dayjs(row.startTime).add(-new Date().getTimezoneOffset(), 'minutes').toDate(), // Ensure this is interpreted as UTC
      dayjs(new Date(row.endTime)).add(-new Date().getTimezoneOffset(), 'minutes').toDate(), // Ensure this is interpreted as UTC
      row.requesterId,
      row.id,
      row.deleted,
    )
  }
}

/* ---------- TimeSlotRepository ---------- */
export class TimeSlotRepository {
  private _sql: postgres.Sql<Record<string, postgres.PostgresType>>

  constructor(private _port: number) {
    this._sql = postgres({
      host: 'localhost',
      port: this._port,
      database: 'test',
      username: 'test',
      password: 'test',
    })
  }

  async lock({ requesterId, resourceId, startTime: from, endTime: to }: TimeSlot) {
    await this._sql.begin(async (sql) => {
      await sql`
        SELECT upsert_select_reservation(
          ${requesterId},
          ${resourceId},
          ${from.toISOString()}::timestamptz,
          ${to.toISOString()}::timestamptz
        );
      `
      // await sql.unsafe(`
      //   DO $$
      //   DECLARE
      //     v_count INTEGER;
      //   BEGIN
      //     SELECT 1 AS "count"
      //     INTO v_count
      //     FROM "TimeSlot2" t
      //     WHERE "t"."resourceId"=${resourceId}
      //       AND "t"."startTime" < '${to.toISOString()}'
      //       AND "t"."endTime" > '${from.toISOString()}'
      //       AND "t"."deleted"=False
      //     LIMIT 1
      //     FOR UPDATE;

      //     IF FOUND THEN
      //       RAISE EXCEPTION 'CONFLICT on ${from.toISOString()}-${to.toISOString()} (${resourceId})';
      //     END IF;

      //     INSERT INTO "TimeSlot2" ("requesterId", "resourceId", "startTime", "endTime", "deleted")
      //     VALUES ('${requesterId}', ${resourceId}, '${from.toISOString()}'::timestamptz, '${to.toISOString()}'::timestamptz, False);

      //   END $$;
      // `)
    })
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    const results: TimeSlot[] = await this._sql.unsafe(`select * from "TimeSlot2" where "resourceId"=${resourceId}`)

    return results.map(TimeSlot.fromDatabase)
  }

  async unlock(resourceId: number, requesterId: string, startTime?: Date, endTime?: Date) {
    try {
      const result = await this._sql`
        UPDATE "TimeSlot2"
        SET "deleted" = true
        WHERE "requesterId" = ${requesterId}
        AND "resourceId" = ${resourceId}
        ${startTime && endTime ? this._sql`AND "startTime"=${startTime.toISOString()} AND "endTime"=${endTime.toISOString()}` : this._sql``}
      `
      return result.count
    } catch (error) {
      console.error('Error unlocking timeslot:', error)
      throw error
    }
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  async lock(requesterId: string, from: Date, to: Date) {
    return new TimeSlot(this.resourceId, from, to, requesterId)
  }
}
