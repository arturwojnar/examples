import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import { TimeAvailability, TimeSlotRepository } from './timeslots'
import { avg } from './utils'

const firstDate = new Date('2024-05-01 10:00:00')
const resourceId = 100
const requesterId = `sabina`
const repo = new TimeSlotRepository()

export const populateTimeSlots = async () => {
  const prisma = new PrismaClient()
  const TO_MINUTES = 60000
  const requesterId = `artur`

  for (let i = 0; i < 100; i++) {
    const from = dayjs(firstDate)
      .add(i * 10, 'days')
      .toDate()
    const timeSlotSize = 15

    for (let resourceId = 1; resourceId < 1000; resourceId++) {
      await prisma.timeSlot.createMany({
        data: Array(500)
          .fill(0)
          .map((_, i) => {
            const startTime = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
            return {
              resourceId,
              requesterId,
              startTime,
              endTime: new Date(startTime.getTime() + timeSlotSize * TO_MINUTES),
            }
          }),
      })
    }
  }
}

export const test = async () => {
  try {
    // await populateTimeSlots()
    const results1 = new Array<number>(30)
    const results2 = new Array<number>(5)

    for (let i = 0; i < results1.length; i++) {
      const from = dayjs(firstDate).add(i * 10, 'days')
      const to = from.add(1, 'day')
      const start = performance.now()
      await saveAvailability(from.toDate(), to.toDate())
      results1[i] = performance.now() - start
    }

    console.info(`Average for conflicts is ${avg(results1)} ms`)

    for (let i = 0; i < results2.length; i++) {
      const from = dayjs(firstDate).add(i * 10 + 6, 'days')
      const to = from.add(1, 'day')
      const start = performance.now()
      await saveAvailability(from.toDate(), to.toDate())
      results2[i] = performance.now() - start
    }

    console.info(`Average for inserts is ${avg(results2)} ms`)
  } catch (error) {
    console.error(error)
  }
}

const saveAvailability = async (from: Date, to: Date) => {
  const timeSlots = await repo.find(resourceId) // around 50000
  const availability = new TimeAvailability(100, timeSlots)

  await availability.Lock(requesterId, from, to)
}
