import dayjs from 'dayjs'
// import { avg } from '../utils'
import { PrismaClient } from '@prisma/client'
import { TimeSlot, TimeSlotRepository } from './gist-timeslots.js'

const requesterId = `artur`
const requesterId2 = `sabina`
const prisma = new PrismaClient()
const repo = new TimeSlotRepository(prisma)
export const avg = (values: Array<number>) => values.reduce((value, sum) => value + sum, 0) / values.length

export const testConcurrent = async (startDate: Date): Promise<[number, number]> => {
  const promises1 = new Array<Promise<number>>(10000)
  const results1 = new Array<number>(10000)
  const results2 = new Array<number>(10000)

  const p1 = (async function () {
    for (let i = 0; i < results1.length; i++) {
      const from = dayjs(startDate).add(i * 5, 'days')
      const to = from.add(2, 'hours')

      promises1[i] = saveAvailability(from.toDate(), to.toDate(), requesterId2, 120000001 + i).then((time) => {
        results1[i] = time
        return time
      })
    }

    await Promise.all(promises1)
  })()

  await p1

  // console.info(`* Average for conflicts is ${avg(results1)} ms`)

  // for (let i = 0; i < results2.length; i++) {
  //   const from = dayjs(startDate).add(i * 30 + 6, 'days')
  //   const to = from.add(1, 'day')
  //   const start = performance.now()
  //   await saveAvailability(from.toDate(), to.toDate(), requesterId2)
  //   results2[i] = performance.now() - start
  // }

  // console.info(`* Average for inserts is ${avg(results2)} ms`)

  return [avg(results1), 0]
}

export const saveAvailability = async (from: Date, to: Date, requesterId: string, resourceId = 100) => {
  const start = performance.now()
  await repo.create(new TimeSlot([from, to], resourceId, requesterId))
  return performance.now() - start
}

export const removeAvailability = async (resourceId: number, requesterId: string, startTime: Date, endTime: Date) => {
  const start = performance.now()
  await repo.unlock(requesterId, resourceId, startTime, endTime)
  return performance.now() - start
}
