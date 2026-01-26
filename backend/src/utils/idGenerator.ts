import Counter from '../models/Counter'

/**
 * Generate a readable booking number in format: BOOK-YYYY-NNNNNN
 * Example: BOOK-2026-000123
 */
export const generateBookingNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const counterId = `booking-${year}`

  try {
    // Atomically increment and get the counter
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    // Format: BOOK-YYYY-NNNNNN (6 digits with leading zeros)
    const sequence = counter.sequence.toString().padStart(6, '0')
    return `BOOK-${year}-${sequence}`
  } catch (error) {
    console.error('Error generating booking number:', error)
    // Fallback to timestamp-based unique ID if counter fails
    return `BOOK-${year}-${Date.now().toString().slice(-6)}`
  }
}

/**
 * Generate a readable contract number in format: CONT-YYYYMMDD-XXXXX
 * Example: CONT-20260125-A3F9K
 */
export const generateContractNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  
  // Generate 5-character alphanumeric random code (uppercase)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding similar chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `CONT-${year}${month}${day}-${code}`
}

/**
 * Generate a readable user reference in format: USER-YYYY-NNNNNN
 * Example: USER-2026-000123
 */
export const generateUserReference = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const counterId = `user-${year}`

  try {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    const sequence = counter.sequence.toString().padStart(6, '0')
    return `USER-${year}-${sequence}`
  } catch (error) {
    console.error('Error generating user reference:', error)
    return `USER-${year}-${Date.now().toString().slice(-6)}`
  }
}
