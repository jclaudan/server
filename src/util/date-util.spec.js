import { DateTime } from 'luxon'
import {
  isHolidays,
  isWorkingDay,
  getFrenchLuxon,
  getFrenchLuxonFromObject,
  getFrenchFormattedDateTime,
} from './date-util'

DateTime.prototype.isHolidays = function () {
  return isHolidays(this)
}

DateTime.prototype.isWorkingDay = function () {
  return isWorkingDay(this)
}

describe('test day off', () => {
  it('should true if date is holidays', () => {
    const isH = DateTime.local(2022, 5, 26, 12, 30, 12).isHolidays()
    expect(isH).toBe(true)
  })

  it('should false if date is not holiday', () => {
    const isH = DateTime.local(2022, 2, 26, 12, 30, 12).isHolidays()
    expect(isH).toBe(false)
  })

  it('should true if date is working day', () => {
    // samedi 26 fevrier 2022
    const isH = DateTime.local(2022, 2, 26, 12, 30, 12).isWorkingDay()
    expect(isH).toBe(true)
  })

  it('should false if date is working day', () => {
    // dimanche 27 fevrier 2022
    const isH = DateTime.local(2022, 3, 27, 12, 30, 12).isWorkingDay()
    expect(isH).toBe(false)
  })
})

describe('Date utils', () => {
  it('Should return 10h in UTC', () => {
    const luxonFrenchDate = getFrenchLuxonFromObject({ month: 6, hour: 10 })
    const dateAsISOString = luxonFrenchDate.toJSDate().toISOString()
    const time = dateAsISOString.split('T')[1].split(':')[0]
    expect(time).toBe('08')
  })
  it('Should get hour wiht 08:00', () => {
    const dateTest = getFrenchLuxon().set({ hour: 8, minute: 0 })
    const hourJsTest = dateTest.toLocaleString({
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    expect(hourJsTest).toBe('08:00')

    const dateResult = getFrenchFormattedDateTime(dateTest, undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    expect(dateResult).toHaveProperty('hour', '08:00')
  })
})
