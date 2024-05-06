import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import { TimeAvailability, TimeSlotRepository } from './timeslots.js'
import { avg } from './utils.js'

const firstDate = new Date('2024-05-01 10:00:00')
const requesterId = `sabina`

export const populateTimeSlots = async () => {
  const prisma = new PrismaClient()
  const TO_MINUTES = 60000
  const requesterId = `artur`

  for (let i = 0; i < 100; i++) {
    const from = dayjs(firstDate)
      .add(i * 30, 'days')
      .toDate()
    const timeSlotSize = 15

    for (let resourceId = 0; resourceId < 10000; resourceId++) {
      await prisma.timeSlot.createMany({
        data: Array(120)
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

export const test = async (startDate: Date): Promise<[number, number]> => {
  // await populateTimeSlots()
  const results1 = new Array<number>(30)
  const results2 = new Array<number>(30)

  for (let i = 0; i < results1.length; i++) {
    const from = dayjs(startDate).add(i * 30, 'days')
    const to = from.add(1, 'day')
    const start = performance.now()
    try {
      await saveAvailability(from.toDate(), to.toDate())
      throw new Error(`Conflict. It should've not happened`)
    } catch {
      //
    }
    results1[i] = performance.now() - start
  }

  console.info(`Average for conflicts is ${avg(results1)} ms`)

  for (let i = 0; i < results2.length; i++) {
    const from = dayjs(startDate).add(i * 30 + 6, 'days')
    const to = from.add(1, 'day')
    const start = performance.now()
    await saveAvailability(from.toDate(), to.toDate())
    results2[i] = performance.now() - start
  }

  console.info(`Average for inserts is ${avg(results2)} ms`)

  return [avg(results1), avg(results2)]
}

const saveAvailability = async (from: Date, to: Date) => {
  const repo = new TimeSlotRepository()
  const availability = new TimeAvailability(100)
  const timeslots = await availability.Lock(requesterId, from, to)
  await repo.createMany(timeslots)
}
