import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import { TimeAvailability, TimeSlotRepository } from './select-timeslots.js'
import { avg } from './utils.js'

const firstDate = new Date('2024-05-01 10:00:00')
const requesterId = `sabina`
const repo = new TimeSlotRepository()

export const populateTimeSlots = async () => {
  const prisma = new PrismaClient()
  const requesterId = `artur`

  for (let i = 0; i < 100; i++) {
    const from = dayjs(firstDate)
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

export const test = async () => {
  try {
    // await populateTimeSlots()
    const results1 = new Array<number>(30)
    const results2 = new Array<number>(30)

    for (let i = 0; i < results1.length; i++) {
      const from = dayjs(firstDate).add(i * 10, 'days')
      const to = from.add(1, 'day')
      const start = performance.now()
      try {
        await saveAvailability(from.toDate(), to.toDate())
      } catch {
        //
      }
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
  const availability = new TimeAvailability(100)

  const aggregate = await availability.Lock(requesterId, from, to)

  await repo.create(aggregate.requesterId, aggregate.resourceId, aggregate.startTime, aggregate.endTime)
}
