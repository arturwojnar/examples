import dayjs from 'dayjs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import pg from 'pg'
import { from as copyFrom } from 'pg-copy-streams'
import { TimeAvailability, TimeSlotRepository } from './timeslots.js'
import { avg } from '../utils.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const { Client } = pg
const initialDate = new Date('2024-05-01 10:00:00')
const requesterId = `artur`
const requesterId2 = `sabina`
const repo = new TimeSlotRepository(prisma, 5432)

export const generateTimeSlots = function* () {
  const TO_MINUTES = 60000

  for (let i = 0; i < 100; i++) {
    const from = dayjs(initialDate)
      .add(i * 30, 'days')
      .toDate()
    const timeSlotSize = 15

    for (let resourceId = 0; resourceId < 10000; resourceId++) {
      const result = Array(120)
        .fill(0)
        .map((_, i) => {
          const startTime = new Date(from.getTime() + i * timeSlotSize * TO_MINUTES)
          return {
            resourceId,
            requesterId,
            startTime,
            endTime: new Date(startTime.getTime() + timeSlotSize * TO_MINUTES),
            locked: true,
          }
        })
        .map(
          (slot) =>
            `${slot.requesterId},${slot.resourceId},${slot.startTime.toISOString()},${slot.endTime.toISOString()},True`,
        )
        .join(`\r\n`)

      yield `${result}\r\n`
    }
  }
}

export const populateTimeSlots = async (port: number, user: string, password: string) => {
  const client = new Client({
    host: 'localhost',
    port,
    user,
    password,
    database: 'test',
  })

  try {
    await client.connect()
    const source = Readable.from(generateTimeSlots())
    const copyPsqlStream = client.query(
      copyFrom(
        'COPY "TimeSlot" ("requesterId", "resourceId", "startTime", "endTime", "locked") FROM STDIN WITH (FORMAT csv)',
      ),
    )
    const s1 = new Date().getTime()
    await pipeline(source, copyPsqlStream)
    console.info(`done ${(new Date().getTime() - s1) / 1000}`)
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

export const test = async (startDate: Date): Promise<[number, number]> => {
  const results1 = new Array<number>(30)
  const results2 = new Array<number>(30)

  for (let i = 0; i < results1.length; i++) {
    const from = dayjs(startDate).add(i * 30, 'days')
    const to = from.add(1, 'day')
    const start = performance.now()
    try {
      await saveAvailability(from.toDate(), to.toDate(), requesterId2)
      throw new Error(`Conflict. It should've not happened`)
    } catch {
      //
    }
    results1[i] = performance.now() - start
  }

  console.info(`* Average for conflicts is ${avg(results1)} ms`)

  for (let i = 0; i < results2.length; i++) {
    const from = dayjs(startDate).add(i * 30 + 6, 'days')
    const to = from.add(1, 'day')
    const start = performance.now()
    await saveAvailability(from.toDate(), to.toDate(), requesterId2)
    results2[i] = performance.now() - start
  }

  console.info(`* Average for inserts is ${avg(results2)} ms`)

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
    const from = dayjs(initialDate).add(i * 30, 'days')
    const to = from.add(30, 'hours')

    await removeAvailability(resourceIds[i], requesterId, from.toDate(), to.toDate())

    results1[i] = performance.now() - start
  }

  console.info(`* Average for unlocking is ${avg(results1)} ms`)

  for (let i = 0; i < results2.length; i++) {
    const from = dayjs(initialDate).add(i * 30, 'days')
    const to = from.add(30, 'hours')
    const start = performance.now()
    await saveAvailability(from.toDate(), to.toDate(), requesterId, resourceIds[i])
    results2[i] = performance.now() - start
  }

  console.info(`* Average for relocking is ${avg(results2)} ms`)

  return [avg(results1), avg(results2)]
}

const saveAvailability = async (from: Date, to: Date, requesterId: string, resourceId = 100) => {
  const availability = new TimeAvailability(resourceId)
  const timeslots = await availability.getSlotsForDateRange(requesterId, from, to)
  await repo.lock(timeslots)
}

const removeAvailability = async (resourceId: number, requesterId: string, startTime: Date, endTime: Date) => {
  await repo.unlock(resourceId, requesterId, startTime, endTime)
}
