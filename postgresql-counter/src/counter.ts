import { CounterExceededError } from './errors.js'
import postgres from 'postgres'

const sql = postgres({
  host: '127.0.0.1',
  port: 5432,
  database: 'test',
  username: 'test',
  password: 'test',
  transform: postgres.camel,
})

type Counter = {
  counterId: number
  name: string
  counter: number
  maxNumber: number
}

const TABLE = 'counters'
const createTable = async () =>
  await sql`
  create table if not exists ${sql(TABLE)} (
    counter_id serial primary key,
    name varchar(50) unique not null,
    counter integer not null,
    max_number integer not null
  )
`
const createCounter = async (name: string, maxNumber: number) =>
  await sql`insert into ${sql(TABLE)} ${sql([{ name, counter: 0, maxNumber }])} returning counter_id`

const add = async (counterId: number, value: number) => {
  // pessimistic locking
  await sql.begin(async (sql) => {
    const [counter]: Counter[] = await sql`select * from ${sql(TABLE)} where counter_id=${counterId} for update`
    if (counter.counter + value > counter.maxNumber) throw new CounterExceededError()
    const [{ counter: updated }] =
      await sql`update ${sql(TABLE)} set counter=counter+${value} where counter_id=${counterId} returning counter`
    console.log(updated)
  })
}

const substract = async (counterId: number, value: number) => {
  // pessimistic locking
  await sql.begin(async (sql) => {
    const [counter]: Counter[] = await sql`select * from ${sql(TABLE)} where counter_id=${counterId} for update`
    if (counter.counter - value < 0) throw new CounterExceededError()
    const [{ counter: updated }] =
      await sql`update ${sql(TABLE)} set counter=counter-${value} where counter_id=${counterId} returning counter`
    console.log(updated)
  })
}

export { createTable, createCounter, add, substract }
