import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import { TimeAvailability, TimeSlotRepository } from './select-timeslots.js'
import { avg } from './utils.js'

const initialDate = new Date('2024-05-01 10:00:00')
const requesterId = `sabina`
const repo = new TimeSlotRepository()

export const populateTimeSlots = async () => {
  const prisma = new PrismaClient()
  const requesterId = `artur`

  for (let i = 0; i < 100; i++) {
    const from = dayjs(initialDate)
      .add(i * 10, 'days')
      .toDate()

    for (let resourceId = 1; resourceId < 1000; resourceId++) {
      await prisma.timeSlot2.create({
        data: {
          resourceId,
          requesterId,
          startTime: from,
          endTime: dayjs(from).add(7500, 'minutes').toDate(),
        },
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
      throw new Error('Not expected')
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

export const testUnlocking = async (): Promise<[number, number]> => {
  const resourceIds = Array(30)
    .fill(0)
    .map((_, i) => i + 9950)
  const results1 = new Array<number>(30)
  const results2 = new Array<number>(30)

  for (let i = 0; i < results1.length; i++) {
    const start = performance.now()

    await removeAvailability(resourceIds[i], `artur`)

    results1[i] = performance.now() - start
  }

  console.info(`Average for unlocking is ${avg(results1)} ms`)

  for (let i = 0; i < results2.length; i++) {
    const from = dayjs(initialDate).add(i * 30, 'days')
    const to = from.add(1, 'day')
    const start = performance.now()
    await saveAvailability(from.toDate(), to.toDate(), resourceIds[i])
    results2[i] = performance.now() - start
  }

  console.info(`Average for relocking is ${avg(results2)} ms`)

  return [avg(results1), avg(results2)]
}

const saveAvailability = async (from: Date, to: Date, resourceId = 100) => {
  const availability = new TimeAvailability(resourceId)

  const aggregate = await availability.lock(requesterId, from, to)

  await repo.create(aggregate)
}

const removeAvailability = async (resourceId: number, requesterId: string) => {
  const repo = new TimeSlotRepository()
  await repo.unlock(resourceId, requesterId)
}
