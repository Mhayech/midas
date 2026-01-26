import crypto from 'crypto'
import Otp from '../models/Otp'
import * as logger from './logger'

/**
 * Generate a secure 6-digit OTP code
 * @returns {string} 6-digit OTP
 */
export const generateOTP = (): string => {
  // Generate cryptographically secure random 6-digit number
  const otp = crypto.randomInt(100000, 1000000).toString()
  return otp
}

/**
 * Create and save OTP for a user
 * @param userId - User's MongoDB ObjectId
 * @returns {Promise<string>} Generated OTP code
 */
export const createOTP = async (userId: string): Promise<string> => {
  try {
    // Delete any existing unverified OTPs for this user
    await Otp.deleteMany({ user: userId, verified: false })

    // Generate new OTP
    const otpCode = generateOTP()

    // Save OTP to database
    const otp = new Otp({
      user: userId,
      otp: otpCode,
      attempts: 0,
      maxAttempts: 3,
      verified: false,
    })

    await otp.save()
    
    logger.info(`[otpHelper.createOTP] OTP created for user ${userId}`)
    return otpCode
  } catch (error) {
    logger.error('[otpHelper.createOTP] Error creating OTP:', error)
    throw error
  }
}

/**
 * Verify OTP code for a user
 * @param userId - User's MongoDB ObjectId
 * @param otpCode - OTP code to verify
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const verifyOTP = async (
  userId: string,
  otpCode: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find the most recent unverified OTP for this user
    const otp = await Otp.findOne({
      user: userId,
      verified: false,
    }).sort({ expireAt: -1 })

    if (!otp) {
      logger.warn(`[otpHelper.verifyOTP] No OTP found for user ${userId}`)
      return {
        success: false,
        message: 'OTP_NOT_FOUND',
      }
    }

    // Check if OTP has expired
    // MongoDB TTL index will auto-delete after expireAfterSeconds (300s = 5 minutes)
    // expireAt is the creation timestamp (Date.now), TTL deletes after expireAt + 300 seconds
    // So we need to check if (now - expireAt) > 300 seconds
    const now = new Date()
    const creationTime = otp.expireAt || new Date()
    const expiryTime = new Date(creationTime.getTime() + 300 * 1000) // 5 minutes from creation
    
    if (now > expiryTime) {
      logger.warn(`[otpHelper.verifyOTP] OTP expired for user ${userId}`)
      await Otp.deleteOne({ _id: otp._id })
      return {
        success: false,
        message: 'OTP_EXPIRED',
      }
    }

    // Check if max attempts exceeded
    if (otp.attempts >= otp.maxAttempts) {
      logger.warn(`[otpHelper.verifyOTP] Max attempts exceeded for user ${userId}`)
      await Otp.deleteOne({ _id: otp._id })
      return {
        success: false,
        message: 'MAX_ATTEMPTS_EXCEEDED',
      }
    }

    // Verify OTP code
    if (otp.otp !== otpCode) {
      // Increment attempts
      otp.attempts += 1
      await otp.save()

      logger.warn(
        `[otpHelper.verifyOTP] Invalid OTP for user ${userId}. Attempts: ${otp.attempts}/${otp.maxAttempts}`,
      )

      return {
        success: false,
        message: 'INVALID_OTP',
      }
    }

    // OTP is valid - mark as verified
    otp.verified = true
    await otp.save()

    logger.info(`[otpHelper.verifyOTP] OTP verified successfully for user ${userId}`)
    return {
      success: true,
      message: 'OTP_VERIFIED',
    }
  } catch (error) {
    logger.error('[otpHelper.verifyOTP] Error verifying OTP:', error)
    throw error
  }
}

/**
 * Check if user has a verified OTP (completed MFA)
 * @param userId - User's MongoDB ObjectId
 * @returns {Promise<boolean>}
 */
export const hasVerifiedOTP = async (userId: string): Promise<boolean> => {
  try {
    const otp = await Otp.findOne({
      user: userId,
      verified: true,
    }).sort({ expireAt: -1 })

    return !!otp
  } catch (error) {
    logger.error('[otpHelper.hasVerifiedOTP] Error checking verified OTP:', error)
    return false
  }
}

/**
 * Delete all OTPs for a user (used after successful signin or logout)
 * @param userId - User's MongoDB ObjectId
 */
export const deleteUserOTPs = async (userId: string): Promise<void> => {
  try {
    await Otp.deleteMany({ user: userId })
    logger.info(`[otpHelper.deleteUserOTPs] Deleted all OTPs for user ${userId}`)
  } catch (error) {
    logger.error('[otpHelper.deleteUserOTPs] Error deleting OTPs:', error)
  }
}
