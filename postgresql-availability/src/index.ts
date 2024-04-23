import { test as testClassicAggregate } from './test-timeslots.js'

const main = async () => {
  try {
    await testClassicAggregate()
  } catch (error) {
    console.error(error)
  }
}

main()
