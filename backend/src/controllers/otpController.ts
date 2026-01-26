import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import * as nodemailer from 'nodemailer'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as otpHelper from '../utils/otpHelper'
import * as mailHelper from '../utils/mailHelper'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'
import User from '../models/User'

/**
 * Send OTP code to user's email after successful password verification.
 * This is the first step of MFA.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const sendOTP = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.SendOTPPayload } = req
  const { userId, email, language } = body

  try {
    if (!userId || !email) {
      logger.error('[otp.sendOTP] userId or email missing', body)
      res.status(400).send('Bad request: userId and email are required')
      return
    }

    // Verify user exists
    const user = await User.findById(userId)
    if (!user || user.email !== email) {
      logger.error(`[otp.sendOTP] User not found or email mismatch: ${userId}`)
      res.status(404).send('User not found')
      return
    }

    // Generate and save OTP
    const otpCode = await otpHelper.createOTP(userId)

    // Set language for email
    if (language) {
      i18n.locale = language
    } else {
      i18n.locale = user.language || 'en'
    }

    // Send OTP via email
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: user.email,
        subject: i18n.t('MFA_OTP_SUBJECT'),
        html:
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; text-align: center;">🔐 ${i18n.t('MFA_OTP_TITLE')}</h2>
              <p style="font-size: 16px; color: #555; line-height: 1.6;">
                ${i18n.t('HELLO')} <strong>${user.fullName}</strong>,<br><br>
                ${i18n.t('MFA_OTP_MESSAGE')}<br><br>
              </p>
              <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                  ${i18n.t('MFA_OTP_CODE_LABEL')}
                </p>
                <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace;">
                  ${otpCode}
                </p>
              </div>
              <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">
                ${i18n.t('MFA_OTP_EXPIRY')}<br>
                ${i18n.t('MFA_OTP_SECURITY_NOTE')}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                ${i18n.t('REGARDS')}<br>
                <strong>${env.WEBSITE_NAME}</strong>
              </p>
            </div>
          </div>`,
      }
      await mailHelper.sendMail(mailOptions)

      logger.info(`[otp.sendOTP] OTP sent successfully to ${user.email}`)
      res.status(200).json({ message: 'OTP_SENT' })
    } catch (mailErr) {
      logger.error(`[otp.sendOTP] Failed to send OTP email to ${user.email}:`, mailErr)
      res.status(500).send('Failed to send OTP email')
    }
  } catch (err) {
    logger.error('[otp.sendOTP] Error:', err)
    res.status(500).send('Internal server error')
  }
}

/**
 * Verify OTP code entered by user.
 * This is the second step of MFA.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const verifyOTP = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.VerifyOTPPayload } = req
  const { userId, otp } = body

  try {
    // Log the entire request for debugging
    logger.info('[otp.verifyOTP] Request body:', JSON.stringify(body))

    if (!userId || !otp) {
      logger.error('[otp.verifyOTP] userId or otp missing', body)
      res.status(400).send('Bad request: userId and otp are required')
      return
    }

    // Verify OTP
    const result = await otpHelper.verifyOTP(userId, otp)

    if (result.success) {
      logger.info('[otp.verifyOTP] OTP verified successfully for user', userId)
      res.status(200).json({ 
        success: true,
        message: result.message,
      })
    } else {
      logger.warn('[otp.verifyOTP] OTP verification failed')
      res.status(400).json({ 
        success: false,
        message: result.message,
      })
    }
  } catch (err) {
    logger.error('[otp.verifyOTP] Error:', err)
    res.status(500).send('Internal server error')
  }
}

/**
 * Resend OTP code to user's email.
 * Allows user to request a new OTP if the previous one expired or was lost.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const resendOTP = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.ResendOTPPayload } = req
  const { userId, email, language } = body

  try {
    if (!userId || !email) {
      logger.error('[otp.resendOTP] userId or email missing', body)
      res.status(400).send('Bad request: userId and email are required')
      return
    }

    // Verify user exists
    const user = await User.findById(userId)
    if (!user || user.email !== email) {
      logger.error('[otp.resendOTP] User not found or email mismatch:', userId)
      res.status(404).send('User not found')
      return
    }

    // Generate new OTP (this will delete old unverified OTPs)
    const otpCode = await otpHelper.createOTP(userId)

    // Set language for email
    if (language) {
      i18n.locale = language
    } else {
      i18n.locale = user.language || 'en'
    }

    // Send new OTP via email
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: user.email,
        subject: i18n.t('MFA_OTP_RESEND_SUBJECT'),
        html:
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; text-align: center;">🔄 ${i18n.t('MFA_OTP_RESEND_TITLE')}</h2>
              <p style="font-size: 16px; color: #555; line-height: 1.6;">
                ${i18n.t('HELLO')} <strong>${user.fullName}</strong>,<br><br>
                ${i18n.t('MFA_OTP_RESEND_MESSAGE')}<br><br>
              </p>
              <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                  ${i18n.t('MFA_OTP_CODE_LABEL')}
                </p>
                <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace;">
                  ${otpCode}
                </p>
              </div>
              <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">
                ${i18n.t('MFA_OTP_EXPIRY')}<br>
                ${i18n.t('MFA_OTP_SECURITY_NOTE')}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                ${i18n.t('REGARDS')}<br>
                <strong>${env.WEBSITE_NAME}</strong>
              </p>
            </div>
          </div>`,
      }
      await mailHelper.sendMail(mailOptions)

      logger.info('[otp.resendOTP] OTP resent successfully to', user.email)
      res.status(200).json({ message: 'OTP_RESENT' })
    } catch (mailErr) {
      logger.error('[otp.resendOTP] Failed to resend OTP email')
      res.status(500).send('Failed to resend OTP email')
    }
  } catch (err) {
    logger.error('[otp.resendOTP] Error:', err)
    res.status(500).send('Internal server error')
  }
}
