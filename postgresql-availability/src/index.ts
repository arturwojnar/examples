import { populateTimeSlots as populateSelectTimeSlots } from './select/test-select-timeslots.js'
import {
  populateTimeSlots as populate15MinTimeSlots,
  populateTimeSlots as populateTimeSlots,
} from './timeslots/test-timeslots.js'
import {
  test as test15MinTimeslotsAggregate,
  testUnlocking as test15MinTimeslotsUnlocking,
} from './timeslots/test-timeslots.js'
import { test as testSelectAggregate, testUnlocking as testSelectUnlocking } from './select/test-select-timeslots.js'
import {
  populateTimeSlots as populateGistTimeslots,
  test as testGistTimeslots,
  testUnlocking as testGistUnlocking,
} from './gist/test-gist-timeslots.js'
import dayjs from 'dayjs'
import { avg } from './utils.js'
import {
  testConcurrent as testSelectConcurrent,
  testUnlockingConcurrently as testSelectUnlockingConcurrently,
} from './select/test-concurrent.js'
import {
  testInsertConcurrently as testGistInsertConcurrently,
  testUnlockingConcurrently as testGistUnlockingConcurrently,
} from './gist/test-concurrent.js'
import {
  testInsertsConcurrently as testTimeslotsConcurrent,
  testUnlockingConcurrently as testTimeslotsUnlockingConcurrently,
} from './timeslots/test-concurrent.js'
import { exit } from 'process'

const firstDate = new Date('2024-05-01 10:00:00')
const main = async () => {
  try {
    const avg = await testTimeslotsUnlockingConcurrently(firstDate)
    console.info(`${avg} ms`)
    exit(0)

    // const [avg] = await testGistConcurrent(firstDate)
    // console.info(`${avg} ms`)

    // await populateGistTimeslots(5432, 'test', 'test')
    // console.info(`Test from the beginning of the range\r\n`)
    // const [a1, b1] = await test15MinTimeslotsAggregate(firstDate)
    // console.info(`Test from the middle of the range`)
    // const [a2, b2] = await test15MinTimeslotsAggregate(
    //   dayjs(firstDate)
    //     .add(40 * 30, 'days')
    //     .toDate(),
    // )
    // console.info(`\r\n`)
    // console.info(`Test the end of the range`)
    // const [a3, b3] = await test15MinTimeslotsAggregate(
    //   dayjs(firstDate)
    //     .add(70 * 30, 'days')
    //     .toDate(),
    // )
    // console.info(`\r\n`)
    // console.info(`* Average for conflicts ${avg([a1, a2, a3])}`)
    // console.info(`* Average for inserts ${avg([b1, b2, b3])}`)
    // console.info(`\r\n`)
    // await test15MinTimeslotsUnlocking()
    exit(0)
  } catch (error) {
    console.error(error)
  }
}

main()
