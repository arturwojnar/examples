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
    return await prisma.timeSlot.create({
      data: {
        requesterId,
        resourceId,
        startTime: from,
        endTime: to,
      },
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
    return prismaTimeSlots.map((slot) => new TimeSlot(slot.id, slot.startTime, slot.endTime, slot.requesterId))
  }
}

/* ---------- TimeAvailability ---------- */
const TO_MINUTES = 60000

export class TimeAvailability {
  private timeSlots: TimeSlot[]

  constructor(
    private resourceId: number,
    timeSlots: TimeSlot[],
  ) {
    this.timeSlots = timeSlots
  }

  async Lock(requesterId: string, from: Date, to: Date, timeSlotSize = 15): Promise<void> {
    // Calculate slots required
    if ((from.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }
    if ((to.getTime() / TO_MINUTES) % 15 !== 0) {
      throw new Error(`The date has to be a multiple of 15 minutes`)
    }

    const durationMinutes = (to.getTime() - from.getTime()) / TO_MINUTES
    const slotsRequired = Math.ceil(durationMinutes / timeSlotSize)

    // Check for overlap
    for (let i = 0; i < slotsRequired; i++) {
      const slotStart = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
      const slotEnd = new Date(slotStart.getTime() + timeSlotSize * TO_MINUTES)

      if (this.timeSlots.some((slot) => slot.isOverlapping(slotStart, slotEnd))) {
        throw new Error('Requested time slot overlaps with an existing slot.')
      }
    }

    // Generate and save new slots
    await prisma.timeSlot.createMany({
      data: Array(slotsRequired)
        .fill(0)
        .map((_, i) => {
          const startTime = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
          return {
            resourceId: this.resourceId,
            requesterId,
            startTime,
            endTime: new Date(startTime.getTime() + timeSlotSize * TO_MINUTES),
          }
        }),
    })
  }

  async Unlock(requesterId: string, from: Date, to: Date): Promise<void> {
    const slotsToDelete = this.timeSlots.filter(
      (slot) => slot.isOverlapping(from, to) && slot.canBeUnlockedBy(requesterId),
    )

    if (slotsToDelete.length === 0) {
      throw new Error('No slots found that can be unlocked by this requester.')
    }

    // Extract timeSlotIds for deletion
    const timeSlotIdsToDelete = slotsToDelete.map((slot) => slot.id)

    try {
      await prisma.timeSlot.deleteMany({
        where: {
          id: {
            in: timeSlotIdsToDelete,
          },
        },
      })
    } catch (error) {
      // Handle or log the error as needed
      throw new Error('Failed to unlock the slots.')
    }
  }
}
