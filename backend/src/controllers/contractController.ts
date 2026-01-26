import { Request, Response } from 'express'
import * as contractService from '../services/contractService.js'
import * as logger from '../utils/logger.js'
import i18n from '../lang/i18n.js'
import Booking from '../models/Booking.js'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Get all contracts with pagination and search
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number.parseInt(req.query.page as string, 10) || 1
    const size = Number.parseInt(req.query.size as string, 10) || 10
    const search = (req.query.search as string) || ''

    const data = await contractService.getContracts(page, size, search)
    
    res.json(data)
  } catch (err) {
    logger.error(`[contract.getContracts] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Generate contract for a booking
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const generateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params

    // Get booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      res.status(404).send('Booking not found')
      return
    }

    // Check if booking is confirmed (Paid status)
    if (booking.status !== bookcarsTypes.BookingStatus.Paid) {
      res.status(400).send('Contract can only be generated for paid bookings')
      return
    }

    // Generate contract
    const contract = await contractService.generateContract(booking)
    
    res.json(contract)
  } catch (err) {
    logger.error(`[contract.generateContract] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get contract by booking ID
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getContractByBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params

    const contract = await contractService.getContractByBooking(bookingId)
    
    if (!contract) {
      res.status(404).send('Contract not found')
      return
    }

    res.json(contract)
  } catch (err) {
    logger.error(`[contract.getContractByBooking] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Download contract PDF
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const downloadContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params

    // Check if booking exists
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      res.status(404).send('Booking not found')
      return
    }

    // Check if booking is paid
    if (booking.status !== bookcarsTypes.BookingStatus.Paid) {
      res.status(400).send('Contract can only be downloaded for paid bookings')
      return
    }

    // Try to get contract
    let contract = await contractService.getContractByBooking(bookingId)
    
    // If no contract exists, try to generate it automatically
    if (!contract) {
      try {
        logger.info(`Contract not found for booking ${bookingId}, generating automatically...`)
        contract = await contractService.generateContract(booking)
        logger.info(`Contract auto-generated for booking ${bookingId}`)
      } catch (genErr) {
        logger.error(`[contract.downloadContract] Failed to auto-generate contract for booking ${bookingId}:`, genErr)
        res.status(404).send('Contract not found and auto-generation failed')
        return
      }
    }

    // Get file stream
    const fileStream = contractService.getContractFile(contract.filePath)

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${contract.fileName}"`)

    // Pipe file to response
    fileStream.pipe(res)

    fileStream.on('error', (err) => {
      logger.error(`[contract.downloadContract] Error streaming file`, err)
      if (!res.headersSent) {
        res.status(500).send('Error downloading contract')
      }
    })
  } catch (err) {
    logger.error(`[contract.downloadContract] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete contract
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const deleted = await contractService.deleteContract(id)
    
    if (!deleted) {
      res.status(404).send('Contract not found')
      return
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[contract.deleteContract] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
