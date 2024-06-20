import dayjs from 'dayjs'
// import { avg } from '../utils'
import { TimeAvailability, TimeSlotRepository } from './timeslots.js'
import { PrismaClient } from '@prisma/client'
import { max } from 'mathjs'

const requesterId = `artur`
const requesterId2 = `sabina`
const prisma = new PrismaClient()
const repo = new TimeSlotRepository(prisma, 5432)
export const avg = (values: Array<number>) => values.reduce((value, sum) => value + sum, 0) / values.length

export const testInsertsConcurrently = async (startDate: Date): Promise<number> => {
  const tests = 10000
  const promises1 = new Array<Promise<number>>(tests)
  const results1 = new Array<number>(tests)

  const p1 = (async function () {
    for (let i = 0; i < results1.length; i++) {
      const from = dayjs(startDate).add(i * 4, 'hours')
      const to = from.add(2, 'hours')

      promises1[i] = saveAvailability(from.toDate(), to.toDate(), requesterId2, 120000001 + i).then((time) => {
        results1[i] = time
        return time
      })
    }

    await Promise.all(promises1)
  })()

  await p1

  return avg(results1)
}

export const testUnlockingConcurrently = async (startDate: Date): Promise<number> => {
  const tests = 1e6
  const promises1 = new Array<Promise<number>>(tests)
  const results1 = new Array<number>(tests)

  const p1 = (async function () {
    for (let i = 0; i < 100; i++) {
      const start = dayjs(startDate)
        .add(i * 30, 'days')
        .toDate()

      for (let resourceId = 0; resourceId < 10000; resourceId++) {
        const from = dayjs(start)
        const to = dayjs(start).add(4, 'hours')

        promises1[i + resourceId] = (async (): Promise<number> => {
          const start = performance.now()
          await repo.unlock(resourceId, requesterId, from.toDate(), to.toDate())
          return performance.now() - start
        })().then((time) => {
          results1[i + resourceId] = time
          return time
        })
      }
    }

    await Promise.all(promises1)
  })()

  await p1

  // console.log(max(...results1))

  return avg(results1)
}

export const saveAvailability = async (from: Date, to: Date, requesterId: string, resourceId = 100) => {
  const start = performance.now()
  const availability = new TimeAvailability(resourceId)
  const timeslots = await availability.getSlotsForDateRange(requesterId, from, to)
  await repo.lock(timeslots)
  return performance.now() - start
}

export const removeAvailability = async (resourceId: number, requesterId: string, startTime: Date, endTime: Date) => {
  const start = performance.now()
  await repo.unlock(resourceId, requesterId, startTime, endTime)
  return performance.now() - start
}
