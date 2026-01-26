import { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import Booking from '../models/Booking'
import Car from '../models/Car'
import User from '../models/User'
import * as helper from '../utils/helper'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'

/**
 * Get financial report data.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const { body } = req
    const { startDate, endDate, supplierId } = body

    // Build query filters
    // Query bookings that overlap with the date range:
    // - Booking starts before or during the period (from <= endDate)
    // - Booking ends after or during the period (to >= startDate)
    const bookingFilter: any = {
      $and: [
        { from: { $lte: new Date(endDate) } }, // Pickup before/during period end
        { to: { $gte: new Date(startDate) } }, // Dropoff after/during period start
      ],
      status: {
        $in: [
          bookcarsTypes.BookingStatus.Paid,
          bookcarsTypes.BookingStatus.Reserved,
        ],
      },
    }

    // Filter by supplier if provided
    if (supplierId) {
      bookingFilter.supplier = new mongoose.Types.ObjectId(supplierId)
    }

    // Fetch all relevant bookings with populated car data
    const bookings = await Booking.find(bookingFilter)
      .populate<{ car: env.Car }>({
        path: 'car',
        populate: {
          path: 'supplier',
          model: 'User',
        },
      })
      .populate<{ driver: env.User }>('driver')
      .lean()

    // Fetch all booking IDs for contract lookup
    const bookingIds = bookings.map((b: any) => b._id)
    const Contract = (await import('../models/Contract.js')).default
    const contracts = await Contract.find({ booking: { $in: bookingIds } })
      .select('booking contractNumber fileName')
      .lean()

    // Create a map of bookingId -> contract for quick lookup
    const contractMap = new Map()
    contracts.forEach((contract: any) => {
      const bookingId = contract.booking.toString()
      contractMap.set(bookingId, {
        bookingId, // Add booking ID to the response
        contractNumber: contract.contractNumber,
        fileName: contract.fileName,
      })
    })

    // Calculate total earnings
    const totalEarnings = bookings.reduce(
      (sum: number, booking: any) => sum + (booking.price || 0),
      0
    )

    // Calculate total rentals
    const totalRentals = bookings.length

    // Group earnings by car
    const carEarningsMap = new Map<string, any>()

    bookings.forEach((booking: any) => {
      if (booking.car && typeof booking.car === 'object') {
        const car = booking.car as env.Car
        const carId = (car._id as mongoose.Types.ObjectId).toString()
        const carName = car.name || 'Unknown'
        const carMake = carName.split(' ')[0] || 'Unknown'

        // Calculate booking duration in days
        const from = new Date(booking.from)
        const to = new Date(booking.to)
        const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

        if (!carEarningsMap.has(carId)) {
          carEarningsMap.set(carId, {
            carId,
            carName,
            carMake,
            immatriculation: car.immatriculation || 'N/A',
            totalEarnings: 0,
            rentalCount: 0,
            totalDaysRented: 0,
            supplierName:
              car.supplier && typeof car.supplier === 'object'
                ? ((car.supplier as unknown) as env.User).fullName
                : 'Unknown',
            contracts: [], // Array to store contracts for this car
          })
        }

        const carData = carEarningsMap.get(carId)!
        carData.totalEarnings += booking.price || 0
        carData.rentalCount += 1
        carData.totalDaysRented += days
        carData.averageRentalPrice = carData.totalEarnings / carData.rentalCount

        // Add contract info if exists
        const bookingId = (booking._id as mongoose.Types.ObjectId).toString()
        const contractInfo = contractMap.get(bookingId)
        if (contractInfo) {
          carData.contracts.push(contractInfo)
        }
      }
    })

    // Convert map to array and sort by earnings
    const carEarnings = Array.from(carEarningsMap.values()).sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    )

    // Group earnings by make (brand)
    const makeEarningsMap = new Map<string, any>()

    carEarnings.forEach((carData) => {
      const { carMake } = carData

      if (!makeEarningsMap.has(carMake)) {
        makeEarningsMap.set(carMake, {
          make: carMake,
          totalEarnings: 0,
          rentalCount: 0,
          carCount: 0,
        })
      }

      const makeData = makeEarningsMap.get(carMake)!
      makeData.totalEarnings += carData.totalEarnings
      makeData.rentalCount += carData.rentalCount
      makeData.carCount += 1
      makeData.averageEarningsPerCar = makeData.totalEarnings / makeData.carCount
    })

    // Convert map to array and sort by earnings
    const makeEarnings = Array.from(makeEarningsMap.values()).sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    )

    // Group earnings by supplier
    const supplierEarningsMap = new Map<string, any>()

    bookings.forEach((booking: any) => {
      if (booking.car && typeof booking.car === 'object') {
        const car = booking.car as env.Car
        const supplier = (car.supplier as unknown) as env.User

        if (supplier && typeof supplier === 'object') {
          const supplierId = (supplier._id as mongoose.Types.ObjectId).toString()
          const supplierName = supplier.fullName || 'Unknown'

          if (!supplierEarningsMap.has(supplierId)) {
            supplierEarningsMap.set(supplierId, {
              supplierId,
              supplierName,
              totalEarnings: 0,
              rentalCount: 0,
            })
          }

          const supplierData = supplierEarningsMap.get(supplierId)!
          supplierData.totalEarnings += booking.price || 0
          supplierData.rentalCount += 1
          supplierData.averageRentalPrice =
            supplierData.totalEarnings / supplierData.rentalCount
        }
      }
    })

    // Convert map to array and sort by earnings
    const supplierEarnings = Array.from(supplierEarningsMap.values()).sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    )

    // Group bookings by month for trend analysis
    const monthlyEarnings: any = {}

    bookings.forEach((booking: any) => {
      const date = new Date(booking.from)
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`

      if (!monthlyEarnings[monthKey]) {
        monthlyEarnings[monthKey] = {
          month: monthKey,
          earnings: 0,
          rentals: 0,
        }
      }

      monthlyEarnings[monthKey].earnings += booking.price || 0
      monthlyEarnings[monthKey].rentals += 1
    })

    const monthlyTrends = Object.values(monthlyEarnings).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    )

    // Calculate average rental duration
    const totalDuration = bookings.reduce((sum: number, booking: any) => {
      const from = new Date(booking.from)
      const to = new Date(booking.to)
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    const averageRentalDuration = totalRentals > 0 ? totalDuration / totalRentals : 0

    // Calculate paid vs reserved breakdown
    const paidBookings = bookings.filter(
      (b) => b.status === bookcarsTypes.BookingStatus.Paid
    )
    const reservedBookings = bookings.filter(
      (b) => b.status === bookcarsTypes.BookingStatus.Reserved
    )

    const paidEarnings = paidBookings.reduce((sum, b) => sum + (b.price || 0), 0)
    const reservedEarnings = reservedBookings.reduce(
      (sum, b) => sum + (b.price || 0),
      0
    )

    // Calculate all customers with their rental details
    const customerEarningsMap = new Map<string, any>()

    bookings.forEach((booking: any) => {
      if (booking.driver && typeof booking.driver === 'object') {
        const driver = booking.driver as env.User
        const driverId = (driver._id as mongoose.Types.ObjectId).toString()
        const driverName = driver.fullName || 'Unknown'

        // Get car information
        const car = booking.car as env.Car
        const carName = car.name || 'Unknown'
        const carImmatriculation = car.immatriculation || 'N/A'

        // Calculate booking duration in days
        const from = new Date(booking.from)
        const to = new Date(booking.to)
        const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

        if (!customerEarningsMap.has(driverId)) {
          customerEarningsMap.set(driverId, {
            customerId: driverId,
            customerName: driverName,
            customerEmail: driver.email || '',
            totalSpent: 0,
            rentalCount: 0,
            totalDaysRented: 0,
            carNames: [], // Array to store car names
            carImmatriculations: [], // Array to store immatriculations
            contracts: [], // Array to store contracts for this customer
          })
        }

        const customerData = customerEarningsMap.get(driverId)!
        customerData.totalSpent += booking.price || 0
        customerData.rentalCount += 1
        customerData.totalDaysRented += days
        
        // Add car name if not already present
        if (!customerData.carNames.includes(carName)) {
          customerData.carNames.push(carName)
        }
        
        // Add immatriculation if not already present
        if (!customerData.carImmatriculations.includes(carImmatriculation)) {
          customerData.carImmatriculations.push(carImmatriculation)
        }

        // Add contract info if exists
        const bookingId = (booking._id as mongoose.Types.ObjectId).toString()
        const contractInfo = contractMap.get(bookingId)
        if (contractInfo) {
          customerData.contracts.push(contractInfo)
        }
      }
    })

    const allCustomers = Array.from(customerEarningsMap.values())
      .map(customer => ({
        ...customer,
        carNamesDisplay: customer.carNames.join(', '), // Join car names for display
        carImmatriculationsDisplay: customer.carImmatriculations.join(', '), // Join immatriculations for display
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)

    // Build response
    const report = {
      summary: {
        totalEarnings,
        totalRentals,
        totalDaysRented: totalDuration,
        averageRentalValue: totalRentals > 0 ? totalEarnings / totalRentals : 0,
        averageRentalDuration,
        paidEarnings,
        reservedEarnings,
        paidCount: paidBookings.length,
        reservedCount: reservedBookings.length,
      },
      carEarnings,
      makeEarnings,
      supplierEarnings,
      monthlyTrends,
      allCustomers,
      dateRange: {
        startDate,
        endDate,
      },
    }

    res.json(report)
  } catch (err) {
    logger.error(`[financialReport.getFinancialReport] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Export financial report to CSV.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const exportFinancialReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = req
    const { reportType, data } = body

    let csv = ''

    switch (reportType) {
      case 'carEarnings':
        csv = 'Car Name,Make,Registration,Total Earnings (TND),Rental Count,Total Days Rented,Average Price (TND),Supplier\n'
        data.forEach((item: any) => {
          csv += `"${item.carName}","${item.carMake}","${item.immatriculation}",${item.totalEarnings.toFixed(
            2
          )},${item.rentalCount},${item.totalDaysRented},${item.averageRentalPrice.toFixed(2)},"${item.supplierName}"\n`
        })
        break

      case 'makeEarnings':
        csv = 'Make,Total Earnings (TND),Rental Count,Car Count,Avg Earnings Per Car (TND)\n'
        data.forEach((item: any) => {
          csv += `"${item.make}",${item.totalEarnings.toFixed(2)},${
            item.rentalCount
          },${item.carCount},${item.averageEarningsPerCar.toFixed(2)}\n`
        })
        break

      case 'supplierEarnings':
        csv = 'Supplier,Total Earnings (TND),Rental Count,Average Price (TND)\n'
        data.forEach((item: any) => {
          csv += `"${item.supplierName}",${item.totalEarnings.toFixed(2)},${
            item.rentalCount
          },${item.averageRentalPrice.toFixed(2)}\n`
        })
        break

      case 'allCustomers':
        csv = 'Customer Name,Email,Car Names,Immatriculations,Total Spent (TND),Rental Count,Total Days Rented\n'
        data.forEach((item: any) => {
          csv += `"${item.customerName}","${item.customerEmail}","${item.carNamesDisplay}","${item.carImmatriculationsDisplay}",${item.totalSpent.toFixed(
            2
          )},${item.rentalCount},${item.totalDaysRented}\n`
        })
        break

      default:
        res.status(400).send('Invalid report type')
        return
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportType}-${Date.now()}.csv"`
    )
    res.send(csv)
  } catch (err) {
    logger.error(
      `[financialReport.exportFinancialReport] ${i18n.t('DB_ERROR')}`,
      err
    )
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
