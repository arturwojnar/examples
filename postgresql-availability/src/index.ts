import { populateTimeSlots as populateSelectTimeSlots } from './test-select-timeslots.js'
import {
  populateTimeSlots as populate15MinTimeSlots,
  populateTimeSlots as populateTimeSlots,
} from './test-timeslots.js'
import { test as test15MinTimeslotsAggregate, testUnlocking as test15MinTimeslotsUnlocking } from './test-timeslots.js'
import { test as testSelectAggregate, testUnlocking as testSelectUnlocking } from './test-select-timeslots.js'
import {
  populateTimeSlots as populateGistTimeslots,
  test as testGistTimeslots,
  testUnlocking as testGistUnlocking,
} from './test-gist-timeslots.js'
import dayjs from 'dayjs'
import { avg } from './utils.js'

const firstDate = new Date('2024-05-01 10:00:00')
const main = async () => {
  try {
    // await populateGistTimeslots(5432, 'test', 'test')
    console.info(`Test from the beginning of the range\r\n`)
    const [a1, b1] = await testGistTimeslots(firstDate)

    console.info(`Test from the middle of the range`)
    const [a2, b2] = await testGistTimeslots(
      dayjs(firstDate)
        .add(40 * 30, 'days')
        .toDate(),
    )
    console.info(`\r\n`)
    console.info(`Test the end of the range`)
    const [a3, b3] = await testGistTimeslots(
      dayjs(firstDate)
        .add(70 * 30, 'days')
        .toDate(),
    )
    console.info(`\r\n`)
    console.info(`* Average for conflicts ${avg([a1, a2, a3])}`)
    console.info(`* Average for inserts ${avg([b1, b2, b3])}`)
    console.info(`\r\n`)
    await testGistUnlocking()
  } catch (error) {
    console.error(error)
  }
}

main()
