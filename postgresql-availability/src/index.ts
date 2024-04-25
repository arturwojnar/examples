import { populateTimeSlots } from './test-select-timeslots.js'
import { test as testClassicAggregate } from './test-timeslots.js'
import { test as testSelectAggregate } from './test-select-timeslots.js'

const main = async () => {
  try {
    await testSelectAggregate()
  } catch (error) {
    console.error(error)
  }
}

main()
