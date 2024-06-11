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

  async create({ requesterId, resourceId, startTime: from, endTime: to }: TimeSlot) {
    await this._sql.begin(async (sql) => {
      await sql.unsafe(`
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
            RAISE EXCEPTION 'CONFLICT on ${from.toISOString()}-${to.toISOString()} (${resourceId})';
          END IF;
        
          INSERT INTO "TimeSlot2" ("requesterId", "resourceId", "startTime", "endTime", "deleted")
          VALUES ('${requesterId}', ${resourceId}, '${from.toISOString()}', '${to.toISOString()}', False);

        END $$;
      `)
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

  async unlock(resourceId: number, requesterId: string, startTime?: Date, endTime?: Date) {
    const result = await this._prisma.timeSlot2.updateMany({
      where: {
        requesterId,
        resourceId,
        ...(startTime && endTime ? { startTime: { gte: startTime }, endTime: { lte: endTime } } : {}),
      },
      data: {
        deleted: true,
      },
    })

    return result
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  async lock(requesterId: string, from: Date, to: Date) {
    return new TimeSlot(this.resourceId, from, to, requesterId)
  }
}
