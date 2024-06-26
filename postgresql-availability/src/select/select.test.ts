import { describe, expect, test, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { exec } from 'child_process'
import util from 'util'
import { __dirname } from '../../dirnameUtil.mjs'
import { TimeSlot, TimeSlotRepository } from './select-timeslots'

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

describe(`select`, () => {
  jest.setTimeout(60000)

  const resourceId1 = 1000
  const resourceId2 = 2000
  const requester1 = `artur`
  const timeslot = new TimeSlot(
    resourceId1,
    new Date(`2024-05-22T10:00:00.000Z`),
    new Date(`2024-05-22T11:00:00.000Z`),
    requester1,
  )

  let prisma: PrismaClient
  let port: number
  let container: StartedPostgreSqlContainer

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start()
    const datasourceUrl = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}?schema=public`
    prisma = new PrismaClient({ datasourceUrl })
    port = container.getPort()
    await prisma.$connect()
    await runMigrations(datasourceUrl)
    console.log(1)
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await container.stop()
  })

  test(`time slots can be added`, async () => {
    const repo = new TimeSlotRepository(port)

    await repo.lock(timeslot)
    const result = await repo.find(resourceId1)

    expect(result.length).toBe(1)
    expect(result).toEqual([
      {
        ...timeslot.toJSON(),
        id: expect.any(Number),
      },
    ])
  })

  test(`can't add an overlapping timeslot`, async () => {
    const repo = new TimeSlotRepository(port)

    await expect(() =>
      repo.lock(
        new TimeSlot(
          resourceId1,
          new Date(`2024-05-22T10:59:00.000Z`),
          new Date(`2024-05-22T11:21:00.000Z`),
          requester1,
        ),
      ),
    ).rejects.toThrowError()
  })

  test(`the same time slots can be added but for different resource`, async () => {
    const repo = new TimeSlotRepository(port)

    await repo.lock(
      new TimeSlot(resourceId2, new Date(`2024-05-22T10:00:00.000Z`), new Date(`2024-05-22T11:00:00.000Z`), requester1),
    )
    const result = await repo.find(resourceId2)

    expect(result).toEqual([
      {
        ...timeslot.toJSON(),
        resourceId: resourceId2,
        id: expect.any(Number),
      },
    ])
  })

  test(`slots can be deleted`, async () => {
    const repo = new TimeSlotRepository(port)

    const count = await repo.unlock(
      resourceId1,
      requester1,
      new Date(`2024-05-22T10:00:00.000Z`),
      new Date(`2024-05-22T11:00:00.000Z`),
    )

    const result = await repo.find(resourceId1)
    expect(count).toBe(1)
    expect(result).toEqual([
      {
        ...timeslot.toJSON(),
        deleted: true,
        id: expect.any(Number),
      },
    ])
  })

  test(`slots can be created again if deleted previously`, async () => {
    const repo = new TimeSlotRepository(port)

    await repo.lock(timeslot)
    const result = await repo.find(resourceId1)

    expect(result).toEqual([
      {
        ...timeslot.toJSON(),
        deleted: true,
        id: expect.any(Number),
      },
      {
        ...timeslot.toJSON(),
        deleted: false,
        id: expect.any(Number),
      },
    ])
  })
})
