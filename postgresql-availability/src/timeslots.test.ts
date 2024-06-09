import { describe, expect, test, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { exec } from 'child_process'
import util from 'util'
import { __dirname } from '../dirnameUtil.mjs'
import { TimeSlot, TimeSlotRepository } from './timeslots'

const execPromise = util.promisify(exec)

async function runMigrations(url: string) {
  try {
    const { stdout, stderr } = await execPromise(
      `DATABASE_URL="${url}" npx prisma migrate deploy --schema=${__dirname}/prisma/schema.prisma`,
    )

    console.log(`Migration stdout: ${stdout}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error running migrations: ${error.message}`)
    }

    throw error
  }
}

describe(`time slots`, () => {
  jest.setTimeout(60000)

  const resourceId1 = 1000
  const resourceId2 = 2000
  const requester1 = `artur`
  const timeslots = [
    new TimeSlot(new Date(`2024-05-22 10:00:00`), new Date(`2024-05-22 10:15:00`), resourceId1, requester1),
    new TimeSlot(new Date(`2024-05-22 10:15:00`), new Date(`2024-05-22 10:30:00`), resourceId1, requester1),
    new TimeSlot(new Date(`2024-05-22 10:30:00`), new Date(`2024-05-22 10:35:00`), resourceId1, requester1),
    new TimeSlot(new Date(`2024-05-22 10:45:00`), new Date(`2024-05-22 11:00:00`), resourceId1, requester1),
  ]

  let prisma: PrismaClient
  let container: StartedPostgreSqlContainer

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start()
    const datasourceUrl = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}?schema=public`
    prisma = new PrismaClient({ datasourceUrl })
    await prisma.$connect()
    await runMigrations(datasourceUrl)
    console.log(1)
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await container.stop()
  })

  test(`time slots can be added`, async () => {
    const repo = new TimeSlotRepository(prisma)

    await repo.lock(timeslots)
    const result = await repo.find(resourceId1)

    expect(result.length).toBe(4)
    expect(result).toEqual(
      timeslots.map((data) => ({
        ...data,
        id: expect.any(Number),
      })),
    )
  })

  test(`can't add an overlapping timeslot`, async () => {
    const repo = new TimeSlotRepository(prisma)

    for (let i = 0; i < timeslots.length; i++) {
      await expect(() => repo.create(timeslots[i])).rejects.toThrowError()
    }
  })

  test(`the same time slots can be added but for different resource`, async () => {
    const repo = new TimeSlotRepository(prisma)

    await repo.lock([
      new TimeSlot(new Date(`2024-05-22 10:00:00`), new Date(`2024-05-22 10:15:00`), resourceId2, requester1),
      new TimeSlot(new Date(`2024-05-22 10:15:00`), new Date(`2024-05-22 10:30:00`), resourceId2, requester1),
      new TimeSlot(new Date(`2024-05-22 10:30:00`), new Date(`2024-05-22 10:35:00`), resourceId2, requester1),
      new TimeSlot(new Date(`2024-05-22 10:45:00`), new Date(`2024-05-22 11:00:00`), resourceId2, requester1),
    ])
    const result = await repo.find(resourceId2)

    expect(result.length).toBe(4)
    expect(result).toEqual(
      timeslots.map((data) => ({
        ...data,
        resourceId: resourceId2,
        id: expect.any(Number),
      })),
    )
  })

  test(`slots can be unlocked`, async () => {
    const repo = new TimeSlotRepository(prisma)

    await repo.unlock(resourceId1, requester1)

    const result = await repo.find(resourceId1)
    expect(result).toEqual(
      timeslots.map((data) => ({
        ...data,
        id: expect.any(Number),
        locked: false,
      })),
    )
  })

  test(`slots can be locked again`, async () => {
    const repo = new TimeSlotRepository(prisma)

    await repo.lock(timeslots)
    const result = await repo.find(resourceId1)

    expect(result).toEqual(
      timeslots.map((data) => ({
        ...data,
        locked: true,
        id: expect.any(Number),
      })),
    )
  })
})
