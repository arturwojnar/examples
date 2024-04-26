import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'

export class TimeSlot {
  constructor(
    public startTime: Date,
    public endTime: Date,
    public resourceId: number,
    public requesterId: string,
    public id?: number,
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
    return await prisma.timeSlot.create({
      data: {
        requesterId,
        resourceId,
        startTime: from,
        endTime: to,
      },
    })
  }

  async createMany(slots: TimeSlot[]) {
    return await prisma.timeSlot.createMany({
      data: slots.map((slot) => ({
        requesterId: slot.requesterId,
        resourceId: slot.resourceId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    })
  }

  async find(resourceId: number): Promise<TimeSlot[]> {
    const prismaTimeSlots = await prisma.timeSlot.findMany({
      where: { resourceId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        requesterId: true,
      },
    })
    return prismaTimeSlots.map(
      (slot) => new TimeSlot(slot.startTime, slot.endTime, resourceId, slot.requesterId, slot.id),
    )
  }
}

/* ---------- TimeAvailability ---------- */
const TO_MINUTES = 60000

export class TimeAvailability {
  constructor(private resourceId: number) {}

  async Lock(requesterId: string, from: Date, to: Date, timeSlotSize = 15) {
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
