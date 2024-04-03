import { setTimeout } from 'timers/promises'
import { createCounter, createTable, add } from './counter.js'

const start = async () => {
  try {
    await createTable()
    // const result = await createCounter('value1', 10)
    // await add(3, 1)
    // await add(3, 1)
    // await add(3, 1)
    // const fn1 = async (name: string) => {
    //   for (let i = 0; i < 10; i++) {
    //     await add(3, 1)
    //     console.log(name)
    //     await setTimeout(150)
    //   }
    // }
    // await Promise.all([fn1('A'), fn1('B')])
    while (true) {
      await add(3, 1)
      // await setTimeout(300)
    }
  } catch (e) {
    console.error(e)
  }

  process.exit(1)
}

start()
