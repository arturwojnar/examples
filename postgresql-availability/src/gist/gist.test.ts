import { describe, expect, jest, test } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { exec } from 'child_process'
import util from 'util'
import { __dirname } from '../../dirnameUtil.mjs'
import { TimeSlot, TimeSlotRepository } from './gist-timeslots'

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

describe(`gist`, () => {
  jest.setTimeout(60000)

  const resourceId1 = 1000
  const resourceId2 = 2000
  const requester1 = `artur`
  const requester2 = `sabina`
  const timeslot = new TimeSlot(
    [new Date(`2024-05-22 10:00:00`), new Date(`2024-05-22 11:00:00`)],
    resourceId1,
    requester1,
  )

  let prisma: PrismaClient
  let port: number
  let container: StartedPostgreSqlContainer

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start()
    port = container.getPort()
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
    const repo = new TimeSlotRepository(prisma, port)

    await repo.create(timeslot)
    const result = await repo.find(resourceId1)

    expect(result.length).toBe(1)
    expect(result).toEqual([
      {
        ...timeslot,
        id: expect.any(Number),
        date_range: expect.anything(),
      },
    ])
  })

  test(`can't add an overlapping timeslot`, async () => {
    const repo = new TimeSlotRepository(prisma, port)

    await expect(() =>
      repo.create(
        new TimeSlot([new Date(`2024-05-22 10:59:00`), new Date(`2024-05-22 11:21:00`)], resourceId1, requester1),
      ),
    ).rejects.toThrowError()
  })

  test(`the same time slots can be added but for different resource`, async () => {
    const repo = new TimeSlotRepository(prisma, port)

    await repo.create(
      new TimeSlot([new Date(`2024-05-22 10:00:00`), new Date(`2024-05-22 11:00:00`)], resourceId2, requester1),
    )
    const result = await repo.find(resourceId2)

    expect(result).toEqual([
      {
        ...timeslot,
        resourceId: resourceId2,
        id: expect.any(Number),
        date_range: expect.anything(),
      },
    ])
  })

  test(`slots can be deleted`, async () => {
    const repo = new TimeSlotRepository(prisma, port)

    await repo.unlock(requester1, resourceId1)

    const result = await repo.find(resourceId1)
    expect(result).toEqual([
      {
        ...timeslot,
        deleted: true,
        id: expect.any(Number),
        date_range: expect.anything(),
      },
    ])
  })

  test(`slots can be created again if deleted previously`, async () => {
    const repo = new TimeSlotRepository(prisma, port)

    await repo.create(timeslot)
    const result = await repo.find(resourceId1)

    expect(result).toEqual([
      {
        ...timeslot,
        deleted: true,
        id: expect.any(Number),
        date_range: expect.anything(),
      },
      {
        ...timeslot,
        deleted: false,
        id: expect.any(Number),
        date_range: expect.anything(),
      },
    ])
  })
})
