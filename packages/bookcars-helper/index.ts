// bookcars-helper/index.ts
import * as bookcarsTypes from ':bookcars-types'
import CurrencyConverter, { currencies, convertFromTND } from ':currency-converter'

/**
 * Format a number.
 *
 * @export
 * @param {number} x
 * @param {string} language ISO 639-1 language code
 * @returns {string}
 */
export const formatNumber = (x: number, language: string): string => {
  const parts: string[] = String(x % 1 !== 0 ? x.toFixed(2) : x).split('.')
  const separator = language === 'en' ? ',' : ' '
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return parts.join('.')
}

/**
 * Format a Date number to two digits.
 *
 * @export
 * @param {number} n
 * @returns {string}
 */
export const formatDatePart = (n: number): string => {
  return n > 9 ? String(n) : '0' + n
}

/**
 * Format a date to YYYY-MM-DD format.
 *
 * @export
 * @param {Date} date
 * @returns {string}
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = formatDatePart(date.getMonth() + 1)
  const day = formatDatePart(date.getDate())
  return `${year}-${month}-${day}`
}

/**
 * Format a time to HH:MM format.
 *
 * @export
 * @param {string} time
 * @returns {string}
 */
export const formatTime = (time: string): string => {
  if (!time) return ''
  // If time is already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time
  }
  // If time is in HH:MM:SS format, extract HH:MM
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time.substring(0, 5)
  }
  return time
}

/**
 * Capitalize a string.
 *
 * @export
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Check if a value is a Date.
 *
 * @export
 * @param {?*} [value]
 * @returns {boolean}
 */
export const isDate = (value?: any): boolean => {
  return value instanceof Date && !Number.isNaN(value.valueOf())
}

/**
 * Join two url parts.
 *
 * @param {?string} [part1]
 * @param {?string} [part2]
 * @returns {string}
 */
export const joinURL = (part1?: string, part2?: string) => {
  if (!part1 || !part2) {
    const msg = '[joinURL] part undefined'
    console.log(msg)
    throw new Error(msg)
  }

  if (part1.charAt(part1.length - 1) === '/') {
    part1 = part1.substring(0, part1.length - 1)
  }
  if (part2.charAt(0) === '/') {
    part2 = part2.substring(1)
  }
  return part1 + '/' + part2
}

/**
 * Check if a string is an integer.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isInteger = (val: string) => /^\d+$/.test(val)

/**
 * Check if a string is a year.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isYear = (val: string) => /^\d{2}$/.test(val)

/**
 * Check if a string is a CVV.
 *
 * @param {string} val
 * @returns {boolean}
 */
export const isCvv = (val: string) => /^\d{3,4}$/.test(val)

/**
 * Check if two arrays are equal.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const arrayEqual = (a: any, b: any) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Clone an object or array.
 *
 * @param {*} obj
 * @returns {*}
 */
export const clone = (obj: any) => (Array.isArray(obj) ? Array.from(obj) : Object.assign({}, obj))

/**
 * Clone an array.
 *
 * @export
 * @template T
 * @param {T[]} arr
 * @returns {(T[] | undefined | null)}
 */
export const cloneArray = <T>(arr: T[]): T[] | undefined | null => {
  if (typeof arr === 'undefined') return undefined
  if (arr == null) return null
  return [...arr]
}

/**
 * Check if two filters are equal.
 *
 * @param {?(bookcarsTypes.Filter | null)} [a]
 * @param {?(bookcarsTypes.Filter | null)} [b]
 * @returns {boolean}
 */
export const filterEqual = (a?: bookcarsTypes.Filter | null, b?: bookcarsTypes.Filter | null) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.from !== b.from) return false
  if (a.to !== b.to) return false
  if (a.pickupLocation !== b.pickupLocation) return false
  if (a.dropOffLocation !== b.dropOffLocation) return false
  if (a.keyword !== b.keyword) return false
  return true
}

/**
 * Flatten Supplier array.
 *
 * @param {bookcarsTypes.User[]} suppliers
 * @returns {string[]}
 */
export const flattenSuppliers = (suppliers: bookcarsTypes.User[]): string[] => suppliers.map((supplier) => supplier._id ?? '')

/**
 * Get number of days between two dates.
 *
 * @param {?Date} [from]
 * @param {?Date} [to]
 * @returns {number}
 */
export const days = (from?: Date, to?: Date) => (from && to && Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24))) || 0

/**
 * Get number of hours between two dates.
 *
 * @param {?Date} [from]
 * @param {?Date} [to]
 * @returns {number}
 */
export const hours = (from?: Date, to?: Date): number => {
  if (!from || !to) return 0
  const ms = to.getTime() - from.getTime()
  const hrs = ms / (1000 * 60 * 60)
  return Math.ceil(hrs)
}

/**
 * Check if currency is written from right to left.
 *
 * @returns {*}
 */
export const currencyRTL = (currencySymbol: string) => {
  const isRTL = ['$', '£', '€'].includes(currencySymbol) === false // not a perfect test; used in formatPrice
  return isRTL
}

/**
 * Format price
 *
 * @param {number} price
 * @param {string} currency
 * @param {string} language ISO 639-1 language code
 * @returns {string}
 */
export const formatPrice = (price: number, currency: string, language: string) => {
  const formatedPrice = formatNumber(price, language)

  // caller passes currency code or symbol; we keep a simple behavior:
  if (currencyRTL(currency)) {
    return `${currency}${formatedPrice}`
  }
  return `${formatedPrice} ${currency}`
}

/**
 * Calculate total price.
 *
 * @param {bookcarsTypes.Car} car
 * @param {Date} from
 * @param {Date} to
 * @param {number} priceChangeRate
 * @param {?bookcarsTypes.CarOptions} [options]
 * @returns {number}
 */
export const calculateTotalPrice = (car: bookcarsTypes.Car, from: Date, to: Date, priceChangeRate: number, options?: bookcarsTypes.CarOptions) => {
  let totalPrice = 0
  let totalDays = days(from, to)

  if (car.isDateBasedPrice) {
    let currentDate = new Date(from)
    currentDate.setHours(0, 0, 0, 0)
    let currentDay = 1
    while (currentDay <= totalDays) {
      let applicableRate = car.discountedDailyPrice || car.dailyPrice
      for (const dateBasedPrice of car.dateBasedPrices || []) {
        const _startDate = new Date(dateBasedPrice.startDate!)
        _startDate.setHours(0, 0, 0, 0)
        const _endDate = new Date(dateBasedPrice.endDate!)
        _endDate.setHours(0, 0, 0, 0)
        if (currentDate.getTime() >= _startDate.getTime() && currentDate.getTime() <= _endDate.getTime()) {
          applicableRate = Number(dateBasedPrice.dailyPrice)
          break
        }
      }
      totalPrice += applicableRate
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(0, 0, 0, 0)
      currentDay += 1
    }
  } else {
    const totalHours = hours(from, to)
    totalDays = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24

    let remainingDays = totalDays

    if (remainingDays >= 30) {
      if (car.discountedMonthlyPrice || car.monthlyPrice) {
        totalPrice += (car.discountedMonthlyPrice || car.monthlyPrice)! * Math.floor(remainingDays / 30)
        remainingDays %= 30
      }
    }

    if (remainingDays >= 7) {
      if (car.discountedWeeklyPrice || car.weeklyPrice) {
        totalPrice += (car.discountedWeeklyPrice || car.weeklyPrice)! * Math.floor(remainingDays / 7)
        remainingDays %= 7
      }
    }

    if (remainingDays >= 3) {
      if (car.discountedBiWeeklyPrice || car.biWeeklyPrice) {
        totalPrice += (car.discountedBiWeeklyPrice || car.biWeeklyPrice)! * Math.floor(remainingDays / 3)
        remainingDays %= 3
      }
    }

    if (remainingDays > 0) {
      totalPrice += (car.discountedDailyPrice || car.dailyPrice) * remainingDays
    }

    // Handle hours if less than a day OR leftover time
    if (totalDays === 0 || remainingHours > 0) {
      const hourlyRate = car.discountedHourlyPrice || car.hourlyPrice
      if (hourlyRate) {
        totalPrice += hourlyRate * remainingHours
      } else if (car.dailyPrice || car.discountedDailyPrice) {
        totalPrice += (car.discountedDailyPrice || car.dailyPrice)
      }
    }
  }

  // add extra options
  if (options) {
    if (options.cancellation && car.cancellation > 0) totalPrice += car.cancellation
    if (options.amendments && car.amendments > 0) totalPrice += car.amendments
    if (options.theftProtection && car.theftProtection > 0) totalPrice += car.theftProtection * totalDays
    if (options.collisionDamageWaiver && car.collisionDamageWaiver > 0) totalPrice += car.collisionDamageWaiver * totalDays
    if (options.fullInsurance && car.fullInsurance > 0) totalPrice += car.fullInsurance * totalDays
    if (options.additionalDriver && car.additionalDriver > 0) totalPrice += car.additionalDriver * totalDays
  }

  // apply price change rate
  totalPrice += totalPrice * (priceChangeRate / 100)

  return totalPrice
}

/**
 * Convert price from a given currency to another.
 *
 * This implementation:
 *  - validates currencies against the currency-converter list
 *  - tries a TND-optimized route (exchangerate.host via convertFromTND)
 *  - otherwise uses the CurrencyConverter class (easy-currencies) to convert pairs
 */
export const convertPrice = async (amount: number, from: string, to: string): Promise<number> => {
  const _from = (from || '').toUpperCase()
  const _to = (to || '').toUpperCase()

  if (!checkCurrency(_from)) {
    throw new Error(`Currency ${_from} not supported`)
  }
  if (!checkCurrency(_to)) {
    throw new Error(`Currency ${_to} not supported`)
  }
  if (_from === _to) return amount

  // if converting from TND, use the exchangerate.host optimized helper (more reliable for TND base)
  if (_from === 'TND') {
    try {
      return await convertFromTND(amount, _to)
    } catch (err) {
      // fallback to generic converter below
      console.warn('[convertPrice] convertFromTND failed, falling back to generic converter', err)
    }
  }

  // generic conversion using CurrencyConverter (easy-currencies)
  try {
    const cc = new CurrencyConverter({ from: _from, to: _to, amount })
    const res = await cc.convert()
    return Number((res as number))
  } catch (err) {
    // if generic converter fails, try a fallback using the converter's class but swapped base if needed
    // last resort: throw for the caller to handle
    console.error('[convertPrice] generic conversion failed', err)
    throw err
  }
}

/**
 * Check if currency is supported.
 *
 * @param {string} currency
 * @returns {boolean}
 */
export const checkCurrency = (currency: string) => currencies.findIndex((c) => c === (currency || '').toUpperCase()) > -1

/**
 * Check whether language is french
 *
 * @param {string} language
 * @returns {boolean}
 */
export const isFrench = (language?: string) => language === 'fr'

/**
 * Return all car types.
 *
 * @returns {bookcarsTypes.CarType[]}
 */
export const getAllCarTypes = () => [
  bookcarsTypes.CarType.Diesel,
  bookcarsTypes.CarType.Gasoline,
  bookcarsTypes.CarType.Electric,
  bookcarsTypes.CarType.Hybrid,
  bookcarsTypes.CarType.PlugInHybrid,
  bookcarsTypes.CarType.Unknown
]

/**
 * Randomize (shuffle) an array.
 *
 * @param {any[]} array
 */
export const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

/**
 * Return all user types.
 *
 * @returns {bookcarsTypes.UserType[]}
 */
export const getAllUserTypes = () => [bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier, bookcarsTypes.UserType.User]

/**
 * Return all car ranges.
 *
 * @returns {bookcarsTypes.CarRange[]}
 */
export const getAllRanges = () => [
  bookcarsTypes.CarRange.Mini,
  bookcarsTypes.CarRange.Midi,
  bookcarsTypes.CarRange.Maxi,
  bookcarsTypes.CarRange.Scooter,
  bookcarsTypes.CarRange.Bus,
  bookcarsTypes.CarRange.Truck,
  bookcarsTypes.CarRange.Caravan
]

/**
 * Return all multimedia types.
 *
 * @returns {bookcarsTypes.CarMultimedia[]}
 */
export const getAllMultimedias = () => [
  bookcarsTypes.CarMultimedia.Touchscreen,
  bookcarsTypes.CarMultimedia.Bluetooth,
  bookcarsTypes.CarMultimedia.AndroidAuto,
  bookcarsTypes.CarMultimedia.AppleCarPlay
]

/**
 * Return all fuel policies.
 *
 * @returns {bookcarsTypes.FuelPolicy[]}
 */
export const getAllFuelPolicies = () => [
  bookcarsTypes.FuelPolicy.FreeTank,
  bookcarsTypes.FuelPolicy.LikeForLike,
  bookcarsTypes.FuelPolicy.FullToFull,
  bookcarsTypes.FuelPolicy.FullToEmpty
]

/**
 * Return all statuses.
 *
 * @returns {bookcarsTypes.BookingStatus[]}
 */
export const getAllBookingStatuses = () => [
  bookcarsTypes.BookingStatus.Void,
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Cancelled
]

/**
 * Calculate distance between two points on map.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @param {('K' | 'M')} unit
 * @returns {number}
 */
export const distance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: 'K' | 'M') => {
  const radlat1 = (Math.PI * lat1) / 180
  const radlat2 = (Math.PI * lat2) / 180
  const theta = lon1 - lon2
  const radtheta = (Math.PI * theta) / 180
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  dist = dist * 60 * 1.1515
  if (unit === 'K') {
    dist *= 1.609344
  } else if (unit === 'M') {
    dist *= 0.8684
  }
  return dist
}

/**
 * Format distance in Km/m.
 *
 * @param {number} d distance
 * @param {string} language
 * @returns {string}
 */
export const formatDistance = (d: number, language: string): string => {
  if (d > 0) {
    if (d < 1) {
      d *= 1000
    }
    const parts: string[] = String(d % 1 !== 0 ? d.toFixed(2) : d).split('.')
    const separator = language === 'en' ? ',' : ' '
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    if (parts.length > 1 && parts[1] === '00') {
      parts.splice(1, 1)
    }
    return `${parts.join('.')} ${d < 1 ? 'm' : 'Km'}`
  }
  return ''
}

/**
 * Removes a start line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trimStart = (str: string, char: string): string => {
  let res = str
  while (res.charAt(0) === char) {
    res = res.substring(1, res.length)
  }
  return res
}

/**
 * Removes a leading and trailing line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trimEnd = (str: string, char: string): string => {
  let res = str
  while (res.charAt(res.length - 1) === char) {
    res = res.substring(0, res.length - 1)
  }
  return res
}

/**
 * Removes a stating, leading and trailing line terminator character from a string.
 *
 * @export
 * @param {string} str
 * @param {string} char
 * @returns {string}
 */
export const trim = (str: string, char: string): string => {
  let res = trimStart(str, char)
  res = trimEnd(res, char)
  return res
}

/**
 * Wait a certain time in milliseconds.
 *
 * @param {number} milliseconds
 * @returns {Promise<unknown>}
 */
export const delay = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })

/**
 * Truncates a string.
 *
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) {
    return str
  }

  if (maxLength >= 6) {
    return `${str.slice(0, maxLength - 3)}...`
  }

  return str.slice(0, maxLength)
}
