import mongoose from 'mongoose'
import escapeStringRegexp from 'escape-string-regexp'
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import path from 'node:path'
import asyncFs from 'node:fs/promises'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import Booking from '../models/Booking'
import User from '../models/User'
import Token from '../models/Token'
import Car from '../models/Car'
import Location from '../models/Location'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import PushToken from '../models/PushToken'
import AdditionalDriver from '../models/AdditionalDriver'
import Contract from '../models/Contract'
import * as helper from '../utils/helper'
import * as mailHelper from '../utils/mailHelper'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'
import * as contractService from '../services/contractService'
import stripeAPI from '../payment/stripe'

/**
 * Create a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpsertBookingPayload & { userId?: string } } = req
    
    // Validate: Check if car is already booked during the requested period
    const { car, from, to } = body.booking
    const requestedFrom = new Date(from)
    const requestedTo = new Date(to)
    
    // Find overlapping bookings for this car
    // A booking overlaps if it doesn't end before the new booking starts
    // AND it doesn't start after the new booking ends
    const overlappingBookings = await Booking.find({
      car,
      status: {
        $in: [
          bookcarsTypes.BookingStatus.Paid,
          bookcarsTypes.BookingStatus.Reserved,
          bookcarsTypes.BookingStatus.Deposit,
          bookcarsTypes.BookingStatus.PendingApproval,
        ],
      },
      $or: [
        {
          // Existing booking overlaps with requested period
          from: { $lt: requestedTo },
          to: { $gt: requestedFrom },
        },
      ],
    })
      .select('from to status')
      .lean()

    if (overlappingBookings.length > 0) {
      const conflictingBooking = overlappingBookings[0]
      const conflictFrom = new Date(conflictingBooking.from).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      const conflictTo = new Date(conflictingBooking.to).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      logger.info(
        `[booking.create] Booking conflict detected for car ${car}: ` +
          `Requested ${requestedFrom.toISOString()} to ${requestedTo.toISOString()}, ` +
          `but car is already booked ${conflictingBooking.from} to ${conflictingBooking.to}`,
      )

      res.status(409).send({
        message: `This car is already booked from ${conflictFrom} to ${conflictTo}. Please select different dates or another car.`,
        conflictingPeriod: {
          from: conflictingBooking.from,
          to: conflictingBooking.to,
        },
      })
      return
    }

    if (body.booking.additionalDriver) {
      const additionalDriver = new AdditionalDriver(body.additionalDriver)
      await additionalDriver.save()
      body.booking._additionalDriver = additionalDriver._id.toString()
    }

    // Check if created by Agency Staff
    let requiresApproval = false
    let notifyAdmin = false
    
    if (body.userId) {
      const creator = await User.findById(body.userId)
      if (creator && creator.type === bookcarsTypes.UserType.AgencyStaff) {
        body.booking.createdBy = body.userId
        
        // Only require approval if status is Paid
        if (body.booking.status === bookcarsTypes.BookingStatus.Paid) {
          body.booking.approvalRequired = true
          body.booking.status = bookcarsTypes.BookingStatus.PendingApproval
          requiresApproval = true
        } else {
          // For non-Paid bookings, just notify admin (no approval needed)
          notifyAdmin = true
        }
      }
    }

    const booking = new Booking(body.booking)

    await booking.save()

    // Generate contract only if not requiring approval and booking is paid
    if (!requiresApproval && booking.status === bookcarsTypes.BookingStatus.Paid) {
      try {
        const contractService = await import('../services/contractService.js')
        await contractService.generateContract(booking)
        logger.info(`Contract auto-generated for new booking: ${booking._id}`)
      } catch (contractErr) {
        logger.error(`Failed to generate contract for new booking ${booking._id}:`, contractErr)
        // Don't fail booking creation if contract generation fails
      }
    }

    // Notify admin if requires approval OR if Staff created a non-Paid booking
    if (requiresApproval || notifyAdmin) {
      const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
      if (admin) {
        i18n.locale = admin.language
        const creator = await User.findById(body.userId)
        
        let message: string
        let subject: string
        
        if (requiresApproval) {
          message = `${creator?.fullName || 'Agency Staff'} created booking ${booking._id} with Paid status requiring approval.`
          subject = 'Booking Approval Required'
        } else {
          message = `${creator?.fullName || 'Agency Staff'} created booking ${booking._id} with status: ${booking.status}.`
          subject = 'New Booking Created by Staff'
        }
        
        const notification = new Notification({
          user: admin._id,
          message,
          booking: booking._id,
        })
        await notification.save()

        let counter = await NotificationCounter.findOne({ user: admin._id })
        if (counter) {
          if (typeof counter.count === 'number') {
            counter.count += 1
          } else {
            counter.count = 1
          }
          await counter.save()
        } else {
          counter = new NotificationCounter({ user: admin._id, count: 1 })
          await counter.save()
        }

        if (admin.enableEmailNotifications) {
          const mailOptions: nodemailer.SendMailOptions = {
            from: env.SMTP_FROM,
            to: admin.email,
            subject,
            html: `<p>
              ${i18n.t('HELLO')}${admin.fullName},<br><br>
              ${message}<br><br>
              ${helper.joinURL(env.ADMIN_HOST, requiresApproval ? 'bookings?approvals=true' : `booking?b=${booking._id}`)}<br><br>
              ${i18n.t('REGARDS')}<br>
            </p>`,
          }
          await mailHelper.sendMail(mailOptions)
        }
      }
    }

    res.json(booking)
  } catch (err) {
    logger.error(`[booking.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Notify a supplier or admin.
 *
 * @async
 * @param {env.User} driver
 * @param {string} bookingId
 * @param {env.User} user
 * @param {boolean} notificationMessage
 * @returns {void}
 */
export const notify = async (driver: env.User, bookingId: string, user: env.User, notificationMessage: string) => {
  i18n.locale = user.language

  // notification
  const message = `${driver.fullName} ${notificationMessage} ${bookingId}.`
  const notification = new Notification({
    user: user._id,
    message,
    booking: bookingId,
  })

  await notification.save()
  let counter = await NotificationCounter.findOne({ user: user._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: user._id, count: 1 })
    await counter.save()
  }

  // mail
  if (user.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: user.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${user.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.ADMIN_HOST, `update-booking?b=${bookingId}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }

    await mailHelper.sendMail(mailOptions)
  }
}

/**
 * Send checkout confirmation email to driver.
 *
 * @async
 * @param {env.User} user
 * @param {env.Booking} booking
 * @param {boolean} payLater
 * @returns {unknown}
 */
export const confirm = async (user: env.User, supplier: env.User, booking: env.Booking, payLater: boolean) => {
  const { language } = user
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: env.TIMEZONE,
  }
  const from = booking.from.toLocaleString(locale, options)
  const to = booking.to.toLocaleString(locale, options)
  const car = await Car.findById(booking.car).populate<{ supplier: env.User }>('supplier')
  if (!car) {
    logger.info(`Car ${booking.car} not found`)
    return false
  }
  const pickupLocation = await Location.findById(booking.pickupLocation).populate<{ values: env.LocationValue[] }>('values')
  if (!pickupLocation) {
    logger.info(`Pick-up location ${booking.pickupLocation} not found`)
    return false
  }

  const pickupLocationName = pickupLocation.values.filter((value) => value.language === language)[0].value
  const dropOffLocation = await Location.findById(booking.dropOffLocation).populate<{ values: env.LocationValue[] }>('values')
  if (!dropOffLocation) {
    logger.info(`Drop-off location ${booking.pickupLocation} not found`)
    return false
  }
  const dropOffLocationName = dropOffLocation.values.filter((value) => value.language === language)[0].value

  let contractFile: string | null = null
  if (supplier.contracts && supplier.contracts.length > 0) {
    contractFile = supplier.contracts.find((c) => c.language === user.language)?.file || null
    if (!contractFile) {
      contractFile = supplier.contracts.find((c) => c.language === 'en')?.file || null
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.SMTP_FROM,
    to: user.email,
    subject: `${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART2')}`,
    html:
      `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${!payLater ? `${i18n.t('BOOKING_CONFIRMED_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_PART2')}`
        + '<br><br>' : ''}
        ${i18n.t('BOOKING_CONFIRMED_PART3')}${car.supplier.fullName}${i18n.t('BOOKING_CONFIRMED_PART4')}${pickupLocationName}${i18n.t('BOOKING_CONFIRMED_PART5')}`
      + `${from} ${i18n.t('BOOKING_CONFIRMED_PART6')}`
      + `${car.name}${i18n.t('BOOKING_CONFIRMED_PART7')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART8')}<br><br>`
      + `${i18n.t('BOOKING_CONFIRMED_PART9')}${car.supplier.fullName}${i18n.t('BOOKING_CONFIRMED_PART10')}${dropOffLocationName}${i18n.t('BOOKING_CONFIRMED_PART11')}`
      + `${to} ${i18n.t('BOOKING_CONFIRMED_PART12')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART13')}<br><br>${i18n.t('BOOKING_CONFIRMED_PART14')}${env.FRONTEND_HOST}<br><br>
        ${i18n.t('REGARDS')}<br>
        </p>`,
  }

  if (contractFile) {
    const file = path.join(env.CDN_CONTRACTS, contractFile)
    if (await helper.pathExists(file)) {
      mailOptions.attachments = [{ path: file }]
    }
  }

  await mailHelper.sendMail(mailOptions)

  return true
}

/**
 * Complete checkout process and create Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkout = async (req: Request, res: Response) => {
  try {
    let user: env.User | null
    const { body }: { body: bookcarsTypes.CheckoutPayload } = req
    const { driver } = body

    if (!body.booking) {
      throw new Error('Booking not found')
    }

    const supplier = await User.findById(body.booking.supplier)
    if (!supplier) {
      throw new Error(`Supplier ${body.booking.supplier} not found`)
    }

    if (driver) {
      const { license } = driver
      if (supplier.licenseRequired && !license) {
        throw new Error("Driver's license required")
      }
      if (supplier.licenseRequired && !(await helper.pathExists(path.join(env.CDN_TEMP_LICENSES, license!)))) {
        throw new Error("Driver's license file not found")
      }
      driver.verified = false
      driver.blacklisted = false
      driver.type = bookcarsTypes.UserType.User
      driver.license = null

      user = new User(driver)
      await user.save()

      // create license
      if (license) {
        const tempLicense = path.join(env.CDN_TEMP_LICENSES, license)
        const filename = `${user.id}${path.extname(tempLicense)}`
        const filepath = path.join(env.CDN_LICENSES, filename)
        await asyncFs.rename(tempLicense, filepath)
        user.license = filename
        await user.save()
      }

      const token = new Token({ user: user._id, token: helper.generateToken() })
      await token.save()

      i18n.locale = user.language

      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: user.email,
        subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
        html: `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${i18n.t('ACCOUNT_ACTIVATION_LINK')}<br><br>
        ${helper.joinURL(env.FRONTEND_HOST, 'activate')}/?u=${encodeURIComponent(user.id)}&e=${encodeURIComponent(user.email)}&t=${encodeURIComponent(token.token)}<br><br>
        ${i18n.t('REGARDS')}<br>
        </p>`,
      }
      await mailHelper.sendMail(mailOptions)

      body.booking.driver = user.id
    } else {
      user = await User.findById(body.booking.driver)
    }

    if (!user) {
      throw new Error(`User ${body.booking.driver} not found`)
    }
    if (supplier.licenseRequired && !user!.license) {
      throw new Error("Driver's license required")
    }
    if (supplier.licenseRequired && !(await helper.pathExists(path.join(env.CDN_LICENSES, user!.license!)))) {
      throw new Error("Driver's license file not found")
    }

    if (!body.payLater) {
      const { payPal, paymentIntentId, sessionId } = body

      if (!payPal && !paymentIntentId && !sessionId) {
        throw new Error('paymentIntentId and sessionId not found')
      }

      if (!payPal) {
        body.booking.customerId = body.customerId
      }

      if (paymentIntentId) {
        const paymentIntent = await stripeAPI.paymentIntents.retrieve(paymentIntentId)
        if (paymentIntent.status !== 'succeeded') {
          const message = `Payment failed: ${paymentIntent.status}`
          logger.error(message, body)
          res.status(400).send(message)
        }

        body.booking.paymentIntentId = paymentIntentId
        body.booking.status = body.booking.isDeposit ? bookcarsTypes.BookingStatus.Deposit : bookcarsTypes.BookingStatus.Paid
      } else {
        //
        // Bookings created from checkout with Stripe are temporary
        // and are automatically deleted if the payment checkout session expires.
        //
        let expireAt = new Date()
        expireAt.setSeconds(expireAt.getSeconds() + env.BOOKING_EXPIRE_AT)

        body.booking.sessionId = !payPal ? body.sessionId : undefined
        body.booking.status = bookcarsTypes.BookingStatus.Void
        body.booking.expireAt = expireAt

        //
        // Non verified and active users created from checkout with Stripe are temporary
        // and are automatically deleted if the payment checkout session expires.
        //
        if (!user.verified) {
          expireAt = new Date()
          expireAt.setSeconds(expireAt.getSeconds() + env.USER_EXPIRE_AT)

          user.expireAt = expireAt
          await user.save()
        }
      }
    }

    const { customerId } = body
    if (customerId) {
      user.customerId = customerId
      await user?.save()
    }

    const { language } = user
    i18n.locale = language

    // additionalDriver
    if (body.booking.additionalDriver && body.additionalDriver) {
      const additionalDriver = new AdditionalDriver(body.additionalDriver)
      await additionalDriver.save()
      body.booking._additionalDriver = additionalDriver._id.toString()
    }

    const booking = new Booking(body.booking)

    await booking.save()

    if (booking.status === bookcarsTypes.BookingStatus.Paid && body.paymentIntentId && body.customerId) {
      const car = await Car.findById(booking.car)
      if (!car) {
        throw new Error(`Car ${booking.car} not found`)
      }
      car.trips += 1
      await car.save()
    }

    if (body.payLater || (booking.status === bookcarsTypes.BookingStatus.Paid && body.paymentIntentId && body.customerId)) {
      // Mark car as fully booked
      // if (env.MARK_CAR_AS_FULLY_BOOKED_ON_CHECKOUT) {
      //   await Car.updateOne({ _id: booking.car }, { fullyBooked: false })
      // }

      // Generate contract for paid bookings
      if (booking.status === bookcarsTypes.BookingStatus.Paid) {
        try {
          const contractService = await import('../services/contractService.js')
          await contractService.generateContract(booking)
          logger.info(`Contract auto-generated for checkout booking: ${booking._id}`)
        } catch (contractErr) {
          logger.error(`Failed to generate contract for checkout booking ${booking._id}:`, contractErr)
          // Don't fail checkout if contract generation fails
        }
      }

      // Send confirmation email to customer
      if (!(await confirm(user, supplier, booking, body.payLater))) {
        res.sendStatus(400)
        return
      }

      // Notify supplier
      i18n.locale = supplier.language
      let message = body.payLater ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION') : i18n.t('BOOKING_PAID_NOTIFICATION')
      await notify(user, booking.id, supplier, message)

      // Notify admin
      const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
      if (admin) {
        i18n.locale = admin.language
        message = body.payLater ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION') : i18n.t('BOOKING_PAID_NOTIFICATION')
        await notify(user, booking.id, admin, message)
      }
    }

    res.status(200).send({ bookingId: booking.id })
  } catch (err) {
    logger.error(`[booking.checkout] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Notify driver and send push notification.
 *
 * @async
 * @param {env.Booking} booking
 * @returns {void}
 */
const notifyDriver = async (booking: env.Booking) => {
  const driver = await User.findById(booking.driver)
  if (!driver) {
    logger.info(`Driver ${booking.driver} not found`)
    return
  }

  i18n.locale = driver.language

  const message = `${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART1')} ${booking._id} ${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART2')}`
  const notification = new Notification({
    user: driver._id,
    message,
    booking: booking._id,
  })
  await notification.save()

  let counter = await NotificationCounter.findOne({ user: driver._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: driver._id, count: 1 })
    await counter.save()
  }

  // mail
  if (driver.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: driver.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${driver.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.FRONTEND_HOST, `booking?b=${booking._id}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }
    await mailHelper.sendMail(mailOptions)
  }

  // push notification
  const pushToken = await PushToken.findOne({ user: driver._id })
  if (pushToken) {
    const { token } = pushToken
    const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN, useFcmV1: true })

    if (!Expo.isExpoPushToken(token)) {
      logger.info(`Push token ${token} is not a valid Expo push token.`)
      return
    }

    const messages: ExpoPushMessage[] = [
      {
        to: token,
        sound: 'default',
        body: message,
        data: {
          user: driver._id,
          notification: notification._id,
          booking: booking._id,
        },
      },
    ]

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = expo.chunkPushNotifications(messages)
    const tickets: ExpoPushTicket[] = [];

    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        try {
          const ticketChunks = await expo.sendPushNotificationsAsync(chunk)

          tickets.push(...ticketChunks)

          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          for (const ticketChunk of ticketChunks) {
            if (ticketChunk.status === 'ok') {
              logger.info(`Push notification sent: ${ticketChunk.id}`)
            } else {
              throw new Error(ticketChunk.message)
            }
          }
        } catch (error) {
          logger.error('Error while sending push notification', error)
        }
      }
    })()
  }
}

/**
 * Update Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpsertBookingPayload } = req
    const booking = await Booking.findById(body.booking._id)

    if (booking) {
      if (!body.booking.additionalDriver && booking._additionalDriver) {
        await AdditionalDriver.deleteOne({ _id: booking._additionalDriver })
      }

      if (body.additionalDriver) {
        const {
          fullName,
          email,
          phone,
          birthDate,
        } = body.additionalDriver

        if (booking._additionalDriver) {
          const additionalDriver = await AdditionalDriver.findOne({ _id: booking._additionalDriver })
          if (!additionalDriver) {
            const msg = `Additional Driver ${booking._additionalDriver} not found`
            logger.info(msg)
            res.status(204).send(msg)
            return
          }
          additionalDriver.fullName = fullName
          additionalDriver.email = email
          additionalDriver.phone = phone
          additionalDriver.birthDate = birthDate
          await additionalDriver.save()
        } else {
          const additionalDriver = new AdditionalDriver({
            fullName,
            email,
            phone,
            birthDate,
          })

          await additionalDriver.save()
          booking._additionalDriver = additionalDriver._id
        }
      }

      const {
        supplier,
        car,
        driver,
        pickupLocation,
        dropOffLocation,
        from,
        to,
        status,
        cancellation,
        amendments,
        theftProtection,
        collisionDamageWaiver,
        fullInsurance,
        additionalDriver,
        price,
        isDeposit,
      } = body.booking

      const previousStatus = booking.status

      booking.supplier = new mongoose.Types.ObjectId(supplier as string)
      booking.car = new mongoose.Types.ObjectId(car as string)
      booking.driver = new mongoose.Types.ObjectId(driver as string)
      booking.pickupLocation = new mongoose.Types.ObjectId(pickupLocation as string)
      booking.dropOffLocation = new mongoose.Types.ObjectId(dropOffLocation as string)
      booking.from = from
      booking.to = to
      booking.status = status
      booking.cancellation = cancellation
      booking.amendments = amendments
      booking.theftProtection = theftProtection
      booking.collisionDamageWaiver = collisionDamageWaiver
      booking.fullInsurance = fullInsurance
      booking.additionalDriver = additionalDriver
      booking.price = price as number
      booking.isDeposit = isDeposit || false

      if (!additionalDriver && booking._additionalDriver) {
        booking._additionalDriver = undefined
      }

      await booking.save()

      // Check if status changed to Paid for a Staff-created booking
      if (previousStatus !== status && status === bookcarsTypes.BookingStatus.Paid && booking.createdBy) {
        // Check if booking was created by Agency Staff
        const creator = await User.findById(booking.createdBy)
        if (creator && creator.type === bookcarsTypes.UserType.AgencyStaff) {
          // Set booking to require approval
          booking.approvalRequired = true
          booking.status = bookcarsTypes.BookingStatus.PendingApproval
          await booking.save()

          // Notify admin
          const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
          if (admin) {
            i18n.locale = admin.language
            const message = `${creator.fullName || 'Agency Staff'} changed booking ${booking._id} status to Paid, requiring approval.`
            
            const notification = new Notification({
              user: admin._id,
              message,
              booking: booking._id,
            })
            await notification.save()

            let counter = await NotificationCounter.findOne({ user: admin._id })
            if (counter) {
              if (typeof counter.count === 'number') {
                counter.count += 1
              } else {
                counter.count = 1
              }
              await counter.save()
            } else {
              counter = new NotificationCounter({ user: admin._id, count: 1 })
              await counter.save()
            }

            if (admin.enableEmailNotifications) {
              try {
                const mailOptions: nodemailer.SendMailOptions = {
                  from: env.SMTP_FROM,
                  to: admin.email,
                  subject: 'Booking Approval Required',
                  html: `<p>
                    ${i18n.t('HELLO')}${admin.fullName},<br><br>
                    ${message}<br><br>
                    ${helper.joinURL(env.ADMIN_HOST, 'bookings?approvals=true')}<br><br>
                    ${i18n.t('REGARDS')}<br>
                  </p>`,
                }
                await mailHelper.sendMail(mailOptions)
              } catch (mailErr) {
                logger.error(`Failed to send approval email to admin: ${mailErr}`)
                // Don't fail the booking update if email fails
              }
            }
          }
        }
      }

      if (previousStatus !== status) {
        // notify driver
        await notifyDriver(booking)
      }

      // Populate related fields before returning
      const populatedBooking = await Booking.findById(booking._id)
        .populate<{ supplier: env.User }>('supplier')
        .populate<{ car: env.Car }>({
          path: 'car',
          populate: {
            path: 'supplier',
            model: 'User'
          }
        })
        .populate<{ driver: env.User }>('driver')
        .populate<{ pickupLocation: env.Location }>('pickupLocation')
        .populate<{ dropOffLocation: env.Location }>('dropOffLocation')
        .populate<{ _additionalDriver: env.AdditionalDriver }>('_additionalDriver')
        .lean()

      res.json(populatedBooking)
      return
    }

    logger.error('[booking.update] Booking not found:', body.booking._id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Booking Status.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpdateStatusPayload } = req
    const { ids: _ids, status } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const bulk = Booking.collection.initializeOrderedBulkOp()
    const bookings = await Booking.find({ _id: { $in: ids } })

    bulk.find({ _id: { $in: ids } }).update({ $set: { status } })
    await bulk.execute()

    for (const booking of bookings) {
      if (booking.status !== status) {
        await notifyDriver(booking)
        
        // Generate contract automatically when booking status changes to Paid
        if (status === bookcarsTypes.BookingStatus.Paid && booking.status !== bookcarsTypes.BookingStatus.Paid) {
          try {
            // Import contract service dynamically to avoid circular dependency
            const contractService = await import('../services/contractService.js')
            await contractService.generateContract(booking)
            logger.info(`Contract auto-generated for booking: ${booking._id}`)
          } catch (contractErr) {
            logger.error(`Failed to generate contract for booking ${booking._id}:`, contractErr)
            // Don't fail the entire status update if contract generation fails
          }
        }
      }
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.updateStatus] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteBookings = async (req: Request, res: Response) => {
  try {
    const { body }: { body: string[] } = req
    const ids = body.map((id) => new mongoose.Types.ObjectId(id))
    const bookings = await Booking.find({
      _id: { $in: ids },
      additionalDriver: true,
      _additionalDriver: { $ne: null },
    })

    // Delete associated contracts first
    const contracts = await Contract.find({ booking: { $in: ids } }).lean()
    for (const contract of contracts) {
      try {
        await contractService.deleteContract(contract._id!.toString())
        logger.info(`[booking.deleteBookings] Deleted contract ${contract.contractNumber} for booking ${contract.booking}`)
      } catch (err) {
        logger.error(`[booking.deleteBookings] Failed to delete contract ${contract._id}:`, err)
        // Continue with other deletions even if one fails
      }
    }

    // Delete bookings
    await Booking.deleteMany({ _id: { $in: ids } })
    
    // Delete additional drivers
    const additionalDivers = bookings.map((booking) => new mongoose.Types.ObjectId(booking._additionalDriver))
    await AdditionalDriver.deleteMany({ _id: { $in: additionalDivers } })

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete temporary Booking created from checkout session.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteTempBooking = async (req: Request, res: Response) => {
  const { bookingId, sessionId } = req.params

  try {
    const booking = await Booking.findOne({ _id: bookingId, sessionId, status: bookcarsTypes.BookingStatus.Void, expireAt: { $ne: null } })
    if (booking) {
      const user = await User.findOne({ _id: booking.driver, verified: false, expireAt: { $ne: null } })
      await user?.deleteOne()
    }
    await booking?.deleteOne()
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteTempBooking] ${i18n.t('DB_ERROR')} ${JSON.stringify({ bookingId, sessionId })}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking.findById(id)
      .populate<{ supplier: env.UserInfo }>('supplier')
      .populate<{ car: env.CarInfo }>({
        path: 'car',
        populate: {
          path: 'supplier',
          model: 'User',
        },
      })
      .populate<{ driver: env.User }>('driver')
      .populate<{ pickupLocation: env.LocationInfo }>({
        path: 'pickupLocation',
        populate: {
          path: 'values',
          model: 'LocationValue',
        },
      })
      .populate<{ dropOffLocation: env.LocationInfo }>({
        path: 'dropOffLocation',
        populate: {
          path: 'values',
          model: 'LocationValue',
        },
      })
      .populate<{ _additionalDriver: env.AdditionalDriver }>('_additionalDriver')
      .populate<{ createdBy: env.User }>('createdBy')
      .populate<{ approvedBy: env.User }>('approvedBy')
      .populate<{ rejectedBy: env.User }>('rejectedBy')
      .lean()

    if (booking) {
      const { language } = req.params

      booking.supplier = {
        _id: booking.supplier._id,
        fullName: booking.supplier.fullName,
        avatar: booking.supplier.avatar,
        payLater: booking.supplier.payLater,
        priceChangeRate: booking.supplier.priceChangeRate,
      }

      booking.car.supplier = {
        _id: booking.car.supplier._id,
        fullName: booking.car.supplier.fullName,
        avatar: booking.car.supplier.avatar,
        payLater: booking.car.supplier.payLater,
        priceChangeRate: booking.car.supplier.priceChangeRate,
      }

      booking.pickupLocation.name = booking.pickupLocation.values.filter((value) => value.language === language)[0].value
      booking.dropOffLocation.name = booking.dropOffLocation.values.filter((value) => value.language === language)[0].value

      res.json(booking)
      return
    }

    logger.error('[booking.getBooking] Booking not found:', id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.getBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by sessionId.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingId = async (req: Request, res: Response) => {
  const { sessionId } = req.params

  try {
    const booking = await Booking.findOne({ sessionId })

    if (!booking) {
      logger.error('[booking.getBookingId] Booking not found (sessionId):', sessionId)
      res.sendStatus(204)
      return
    }
    res.json(booking?.id)
  } catch (err) {
    logger.error(`[booking.getBookingId] (sessionId) ${i18n.t('DB_ERROR')} ${sessionId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookings = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.GetBookingsPayload } = req
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const suppliers = body.suppliers.map((id) => new mongoose.Types.ObjectId(id))
    const {
      statuses,
      user,
      car,
    } = body
    const from = (body.filter && body.filter.from && new Date(body.filter.from)) || null
    const dateBetween = (body.filter && body.filter.dateBetween && new Date(body.filter.dateBetween)) || null
    const to = (body.filter && body.filter.to && new Date(body.filter.to)) || null
    const pickupLocation = (body.filter && body.filter.pickupLocation) || null
    const dropOffLocation = (body.filter && body.filter.dropOffLocation) || null
    let keyword = (body.filter && body.filter.keyword) || ''
    const options = 'i'

    const $match: mongoose.FilterQuery<any> = {
      $and: [{ 'supplier._id': { $in: suppliers } }, { status: { $in: statuses } }, { expireAt: null }],
    }

    if (user) {
      $match.$and!.push({ 'driver._id': { $eq: new mongoose.Types.ObjectId(user) } })
    }
    if (car) {
      $match.$and!.push({ 'car._id': { $eq: new mongoose.Types.ObjectId(car) } })
    }

    if (dateBetween) {
      const dateBetweenStart = new Date(dateBetween)
      dateBetweenStart.setHours(0, 0, 0, 0)
      const dateBetweenEnd = new Date(dateBetween)
      dateBetweenEnd.setHours(23, 59, 59, 999)

      $match.$and!.push({
        $and: [
          { from: { $lte: dateBetweenEnd } },
          { to: { $gte: dateBetweenStart } },
        ],
      })
    } else if (from) {
      $match.$and!.push({ from: { $gte: from } }) // $from >= from
    }

    if (to) {
      $match.$and!.push({ to: { $lte: to } })// $to < to
    }
    if (pickupLocation) {
      $match.$and!.push({ 'pickupLocation._id': { $eq: new mongoose.Types.ObjectId(pickupLocation) } })
    }
    if (dropOffLocation) {
      $match.$and!.push({ 'dropOffLocation._id': { $eq: new mongoose.Types.ObjectId(dropOffLocation) } })
    }
    if (keyword) {
      const isObjectId = helper.isValidObjectId(keyword)
      if (isObjectId) {
        $match.$and!.push({
          _id: { $eq: new mongoose.Types.ObjectId(keyword) },
        })
      } else {
        keyword = escapeStringRegexp(keyword)
        $match.$and!.push({
          $or: [
            { 'supplier.fullName': { $regex: keyword, $options: options } },
            { 'driver.fullName': { $regex: keyword, $options: options } },
            { 'car.name': { $regex: keyword, $options: options } },
          ],
        })
      }
    }

    const { language } = req.params

    const data = await Booking.aggregate([
      {
        $lookup: {
          from: 'User',
          let: { supplierId: '$supplier' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$supplierId'] } },
            },
          ],
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Car',
          let: { carId: '$car' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$carId'] } },
            },
          ],
          as: 'car',
        },
      },
      { $unwind: { path: '$car', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'User',
          let: { driverId: '$driver' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$driverId'] } },
            },
          ],
          as: 'driver',
        },
      },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Location',
          let: { pickupLocationId: '$pickupLocation' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$pickupLocationId'] } },
            },
            {
              $lookup: {
                from: 'LocationValue',
                let: { values: '$values' },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $in: ['$_id', '$$values'] } }, { $expr: { $eq: ['$language', language] } }],
                    },
                  },
                ],
                as: 'value',
              },
            },
            {
              $addFields: { name: '$value.value' },
            },
          ],
          as: 'pickupLocation',
        },
      },
      {
        $unwind: { path: '$pickupLocation', preserveNullAndEmptyArrays: false },
      },
      {
        $lookup: {
          from: 'Location',
          let: { dropOffLocationId: '$dropOffLocation' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$dropOffLocationId'] } },
            },
            {
              $lookup: {
                from: 'LocationValue',
                let: { values: '$values' },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $in: ['$_id', '$$values'] } }, { $expr: { $eq: ['$language', language] } }],
                    },
                  },
                ],
                as: 'value',
              },
            },
            {
              $addFields: { name: '$value.value' },
            },
          ],
          as: 'dropOffLocation',
        },
      },
      {
        $unwind: {
          path: '$dropOffLocation',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match,
      },
      {
        $facet: {
          resultData: [{ $sort: { createdAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [
            {
              $count: 'totalRecords',
            },
          ],
        },
      },
    ])

    const bookings: env.BookingInfo[] = data[0].resultData

    for (const booking of bookings) {
      const { _id, fullName, avatar, priceChangeRate } = booking.supplier
      booking.supplier = { _id, fullName, avatar, priceChangeRate }
    }

    res.json(data)
  } catch (err) {
    logger.error(`[booking.getBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Check if a driver has Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const hasBookings = async (req: Request, res: Response) => {
  const { driver } = req.params

  try {
    const count = await Booking
      .find({
        driver: new mongoose.Types.ObjectId(driver),
      })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      res.sendStatus(200)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.hasBookings] ${i18n.t('DB_ERROR')} ${driver}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Cancel a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking
      .findOne({
        _id: new mongoose.Types.ObjectId(id),
      })
      .populate<{ supplier: env.User }>('supplier')
      .populate<{ driver: env.User }>('driver')

    if (booking && booking.cancellation && !booking.cancelRequest) {
      booking.cancelRequest = true
      await booking.save()

      // Notify supplier
      const supplier = await User.findById(booking.supplier)
      if (!supplier) {
        logger.info(`Supplier ${booking.supplier} not found`)
        res.sendStatus(204)
        return
      }
      i18n.locale = supplier.language
      await notify(booking.driver, booking.id, supplier, i18n.t('CANCEL_BOOKING_NOTIFICATION'))

      // Notify admin
      const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
      if (admin) {
        i18n.locale = admin.language
        await notify(booking.driver, booking.id, admin, i18n.t('CANCEL_BOOKING_NOTIFICATION'))
      }

      res.sendStatus(200)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.cancelBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Approve a booking (admin only).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const approveBooking = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: { userId: string; notes?: string } } = req

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('Invalid booking ID')
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      logger.info(`Booking ${id} not found`)
      res.sendStatus(204)
      return
    }

    // Check if booking requires approval
    if (!booking.approvalRequired) {
      res.status(400).send('Booking does not require approval')
      return
    }

    // Update booking with approval info
    booking.approvalRequired = false
    booking.approvedBy = new mongoose.Types.ObjectId(body.userId)
    booking.approvedAt = new Date()
    if (body.notes) {
      booking.approvalNotes = body.notes
    }
    
    // Keep the original status from PendingApproval (it was Paid before approval)
    if (booking.status === bookcarsTypes.BookingStatus.PendingApproval) {
      booking.status = bookcarsTypes.BookingStatus.Paid
    }

    await booking.save()

    // Generate contract since booking is now approved and Paid
    if (booking.status === bookcarsTypes.BookingStatus.Paid) {
      try {
        const contractService = await import('../services/contractService.js')
        await contractService.generateContract(booking)
        logger.info(`Contract generated for approved booking: ${booking._id}`)
      } catch (contractErr) {
        logger.error(`Failed to generate contract for approved booking ${booking._id}:`, contractErr)
      }
    }

    // Notify creator
    if (booking.createdBy) {
      const creator = await User.findById(booking.createdBy)
      if (creator) {
        i18n.locale = creator.language
        const message = i18n.t('BOOKING_APPROVED_MESSAGE', { bookingId: booking._id })
        
        // In-app notification (always sent)
        const notification = new Notification({
          user: creator._id,
          message,
          booking: booking._id,
        })
        await notification.save()

        // Update notification counter
        let counter = await NotificationCounter.findOne({ user: creator._id })
        if (counter) {
          if (typeof counter.count === 'number') {
            counter.count += 1
          } else {
            counter.count = 1
          }
          await counter.save()
        } else {
          counter = new NotificationCounter({ user: creator._id, count: 1 })
          await counter.save()
        }

        // Email notification (only if enabled)
        if (creator.enableEmailNotifications) {
          const mailOptions: nodemailer.SendMailOptions = {
            from: env.SMTP_FROM,
            to: creator.email,
            subject: i18n.t('BOOKING_APPROVED_SUBJECT'),
            html: `<p>
              ${i18n.t('HELLO')}${creator.fullName},<br><br>
              ${i18n.t('BOOKING_APPROVED_MESSAGE', { bookingId: booking._id })}<br><br>
              ${body.notes ? `${i18n.t('ADMIN_NOTES')}: ${body.notes}<br><br>` : ''}
              ${helper.joinURL(env.ADMIN_HOST, `booking?b=${booking._id}`)}<br><br>
              ${i18n.t('REGARDS')}<br>
            </p>`,
          }
          await mailHelper.sendMail(mailOptions)
        }
      }
    }

    res.json(booking)
  } catch (err) {
    logger.error(`[booking.approveBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Reject a booking (admin only).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const rejectBooking = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: { userId: string; notes?: string } } = req

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('Invalid booking ID')
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      logger.info(`Booking ${id} not found`)
      res.sendStatus(204)
      return
    }

    // Check if booking requires approval
    if (!booking.approvalRequired) {
      res.status(400).send('Booking does not require approval')
      return
    }

    // Update booking with rejection info
    booking.approvalRequired = false
    booking.rejectedBy = new mongoose.Types.ObjectId(body.userId)
    booking.rejectedAt = new Date()
    if (body.notes) {
      booking.approvalNotes = body.notes
    }
    booking.status = bookcarsTypes.BookingStatus.Cancelled

    await booking.save()

    // Notify creator
    if (booking.createdBy) {
      const creator = await User.findById(booking.createdBy)
      if (creator) {
        i18n.locale = creator.language
        const message = i18n.t('BOOKING_REJECTED_MESSAGE', { bookingId: booking._id })
        
        // In-app notification (always sent)
        const notification = new Notification({
          user: creator._id,
          message,
          booking: booking._id,
        })
        await notification.save()

        // Update notification counter
        let counter = await NotificationCounter.findOne({ user: creator._id })
        if (counter) {
          if (typeof counter.count === 'number') {
            counter.count += 1
          } else {
            counter.count = 1
          }
          await counter.save()
        } else {
          counter = new NotificationCounter({ user: creator._id, count: 1 })
          await counter.save()
        }

        // Email notification (only if enabled)
        if (creator.enableEmailNotifications) {
          const mailOptions: nodemailer.SendMailOptions = {
            from: env.SMTP_FROM,
            to: creator.email,
            subject: i18n.t('BOOKING_REJECTED_SUBJECT'),
            html: `<p>
              ${i18n.t('HELLO')}${creator.fullName},<br><br>
              ${i18n.t('BOOKING_REJECTED_MESSAGE', { bookingId: booking._id })}<br><br>
              ${body.notes ? `${i18n.t('ADMIN_NOTES')}: ${body.notes}<br><br>` : ''}
              ${i18n.t('REGARDS')}<br>
            </p>`,
          }
          await mailHelper.sendMail(mailOptions)
        }
      }
    }

    res.json(booking)
  } catch (err) {
    logger.error(`[booking.rejectBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get bookings pending approval.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ 
      approvalRequired: true,
      status: bookcarsTypes.BookingStatus.PendingApproval 
    })
      .populate<{ supplier: env.User }>('supplier')
      .populate<{ car: env.Car }>('car')
      .populate<{ driver: env.User }>('driver')
      .populate<{ pickupLocation: env.Location }>('pickupLocation')
      .populate<{ dropOffLocation: env.Location }>('dropOffLocation')
      .populate<{ createdBy: env.User }>('createdBy')
      .sort({ createdAt: -1 })
      .lean()

    res.json(bookings)
  } catch (err) {
    logger.error(`[booking.getPendingApprovals] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get staff activity and performance metrics.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getStaffActivity = async (req: Request, res: Response) => {
  try {
    // Get all agency staff users
    const staffMembers = await User.find({ 
      type: bookcarsTypes.UserType.AgencyStaff,
      verified: true 
    }).lean()

    // Calculate date ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const staffActivity = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get all bookings created by this staff member
        const allBookings = await Booking.find({ createdBy: staff._id }).lean()
        
        // Today's bookings
        const todayBookings = allBookings.filter(
          (b: any) => new Date(b.createdAt) >= startOfToday
        )
        
        // This week's bookings
        const weekBookings = allBookings.filter(
          (b: any) => new Date(b.createdAt) >= startOfWeek
        )
        
        // This month's bookings
        const monthBookings = allBookings.filter(
          (b: any) => new Date(b.createdAt) >= startOfMonth
        )

        // Calculate approval metrics
        const approved = allBookings.filter(
          (b: any) => b.approvedBy && !b.rejectedBy
        ).length
        const rejected = allBookings.filter(
          (b: any) => b.rejectedBy
        ).length
        const pending = allBookings.filter(
          (b: any) => b.status === bookcarsTypes.BookingStatus.PendingApproval
        ).length

        // Calculate revenue from approved/paid bookings
        const revenue = allBookings
          .filter((b: any) => 
            b.status === bookcarsTypes.BookingStatus.Paid || 
            b.status === bookcarsTypes.BookingStatus.Reserved
          )
          .reduce((sum: number, b: any) => sum + (b.price || 0), 0)

        return {
          staff: {
            _id: staff._id,
            fullName: staff.fullName,
            email: staff.email,
            avatar: staff.avatar,
          },
          metrics: {
            total: allBookings.length,
            today: todayBookings.length,
            thisWeek: weekBookings.length,
            thisMonth: monthBookings.length,
            approved,
            rejected,
            pending,
            approvalRate: allBookings.length > 0 
              ? ((approved / (approved + rejected)) * 100).toFixed(1)
              : '0',
            revenue,
          },
          recentBookings: allBookings
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((b: any) => ({
              _id: b._id,
              status: b.status,
              price: b.price,
              createdAt: b.createdAt,
            })),
        }
      })
    )

    // Sort by total bookings (most active first)
    staffActivity.sort((a, b) => b.metrics.total - a.metrics.total)

    res.json(staffActivity)
  } catch (err) {
    logger.error(`[booking.getStaffActivity] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
