import { populateTimeSlots as populateSelectTimeSlots } from './test-select-timeslots.js'
import { populateTimeSlots as populate15MinTimeSlots } from './test-timeslots.js'
import { test as test15MinTimeslotsAggregate, testUnlocking as test15MinTimeslotsUnlocking } from './test-timeslots.js'
import { test as testSelectAggregate, testUnlocking as testSelectUnlocking } from './test-select-timeslots.js'
import { populateTimeSlots as populateGistTimeslots, test as testGistTimeslots } from './test-gist-timeslots.js'
import dayjs from 'dayjs'
import { avg } from './utils.js'

const firstDate = new Date('2024-05-01 10:00:00')
const main = async () => {
  try {
    console.info(`--------- Test from the beginning of the range ---------`)
    const [a1, b1] = await testSelectAggregate(firstDate)
    console.info(`------------------------------------------------------`)

    console.info(`--------- Test from the beginning of the range ---------`)
    const [a2, b2] = await testSelectAggregate(
      dayjs(firstDate)
        .add(40 * 30, 'days')
        .toDate(),
    )
    console.info(`------------------------------------------------------`)

    console.info(`--------- Test the end of the range ---------`)
    const [a3, b3] = await testSelectAggregate(
      dayjs(firstDate)
        .add(70 * 30, 'days')
        .toDate(),
    )
    console.info(`------------------------------------------------------`)

    console.info(`Average for conflicts ${avg([a1, a2, a3])}`)
    console.info(`Average for inserts ${avg([b1, b2, b3])}`)

    console.info(`------------------------------------------------------`)

    await testSelectUnlocking()
  } catch (error) {
    console.error(error)
  }
}

main()
