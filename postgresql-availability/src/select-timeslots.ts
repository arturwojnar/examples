import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'

export class TimeSlot {
  constructor(
    public id: number,
    public startTime: Date,
    public endTime: Date,
    private requesterId: string,
  ) {}

  isOverlapping(from: Date, to: Date): boolean {
    // Check if there is any overlap between [from, to] and the time slot
    return dayjs(from).isBefore(this.endTime) && dayjs(to).isAfter(this.startTime)
  }

  canBeUnlockedBy(requesterId: string): boolean {
    return this.requesterId === requesterId
  }
}

/* ---------- TimeSlotRepository ---------- */
export class TimeSlotRepository {
  async create(requesterId: string, resourceId: number, from: Date, to: Date) {
    await prisma.$transaction(async (prisma) => {
      const result = await prisma.$executeRawUnsafe(
        `
        SELECT 1
        FROM "TimeSlot2" t
        WHERE "t"."startTime" < '${to.toISOString()}'
          AND "t"."endTime" > '${from.toISOString()}'
        LIMIT 1
        FOR UPDATE;
        `,
      )
      if (result > 0) {
        throw new Error('No slots found that can be unlocked by this requester.')
      }
      return await prisma.timeSlot2.create({
        data: {
          requesterId,
          resourceId,
          startTime: from,
          endTime: to,
        },
      })
    })
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    const prismaTimeSlots = await prisma.timeSlot2.findMany({
      where: { resourceId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        requesterId: true,
      },
    })
    return prismaTimeSlots.map((slot) => new TimeSlot(slot.id, slot.startTime, slot.endTime, slot.requesterId))
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  async Lock(requesterId: string, from: Date, to: Date) {
    return {
      resourceId: this.resourceId,
      requesterId,
      startTime: from,
      endTime: to,
    }
  }
}
