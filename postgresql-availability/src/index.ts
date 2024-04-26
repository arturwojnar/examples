import { populateTimeSlots } from './test-select-timeslots.js'
import { test as test15MinTimeslotsAggregate } from './test-timeslots.js'
import { test as testSelectAggregate } from './test-select-timeslots.js'
import { populateTimeSlots as populateGistTimeslots, test as testGistTimeslots } from './test-gist-timeslots.js'

const main = async () => {
  try {
    await populateGistTimeslots()
  } catch (error) {
    console.error(error)
  }
}

main()
