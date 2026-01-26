import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import * as bookcarsTypes from ':bookcars-types'
import Contract from '../models/Contract.js'
import Booking from '../models/Booking.js'
import * as logger from '../utils/logger.js'
import { generateContractNumber } from '../utils/idGenerator.js'

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts')
const TEMPLATE_PATH = path.join(process.cwd(), 'src', 'templates', 'contract-template.html')
const LOGO_PATH = path.join(process.cwd(), 'src', 'assets', 'logo.png')
const CAR_DIAGRAM_PATH = path.join(process.cwd(), 'src', 'templates', 'car.png')

// Ensure contracts directory exists
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true })
}

/**
 * Format date to readable string (French format: DD/MM/YYYY)
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format time
 */
const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} TND`
}

/**
 * Calculate rental days
 */
const calculateDays = (from: Date, to: Date): number => {
  const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Convert image to base64
 */
const getLogoBase64 = (): string => {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const logoBuffer = fs.readFileSync(LOGO_PATH)
      return `data:image/png;base64,${logoBuffer.toString('base64')}`
    }
  } catch (err) {
    logger.warn('Could not load logo:', err)
  }
  // Return empty transparent image if logo not found
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
}

/**
 * Convert car diagram to base64
 */
const getCarDiagramBase64 = (): string => {
  try {
    if (fs.existsSync(CAR_DIAGRAM_PATH)) {
      const diagramBuffer = fs.readFileSync(CAR_DIAGRAM_PATH)
      return `data:image/png;base64,${diagramBuffer.toString('base64')}`
    }
  } catch (err) {
    logger.warn('Could not load car diagram:', err)
  }
  return ''
}

/**
 * Generate PDF contract using HTML template and Puppeteer
 */
export const generateContract = async (booking: any): Promise<bookcarsTypes.Contract> => {
  try {
    // Check if contract already exists
    const existingContract = await Contract.findOne({ booking: booking._id })
    if (existingContract) {
      return existingContract
    }

    const contractNumber = generateContractNumber()
    
    // Populate booking data first to get car name and date
    const populatedBooking = await Booking.findById(booking._id)
      .populate('supplier')
      .populate('car')
      .populate('driver')
      .populate('pickupLocation')
      .populate('dropOffLocation')
      .populate('_additionalDriver')
      .lean()

    if (!populatedBooking) {
      throw new Error('Booking not found')
    }

    const bookingCar = populatedBooking.car as any
    
    // Create descriptive filename: CarName-YYYYMMDD-ContractNumber.pdf
    // Sanitize car name: remove special characters, replace spaces with hyphens
    const carName = (bookingCar?.name || 'Vehicle')
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 30) // Limit length
    
    const bookingDate = new Date(populatedBooking.from)
    const dateStr = `${bookingDate.getFullYear()}${String(bookingDate.getMonth() + 1).padStart(2, '0')}${String(bookingDate.getDate()).padStart(2, '0')}`
    
    const fileName = `${carName}-${dateStr}-${contractNumber}.pdf`
    const filePath = path.join(CONTRACTS_DIR, fileName)

    const supplier = populatedBooking.supplier as any
    const car = bookingCar
    const driver = populatedBooking.driver as any
    const pickupLocation = populatedBooking.pickupLocation as any
    const dropOffLocation = populatedBooking.dropOffLocation as any
    const additionalDriver = populatedBooking._additionalDriver as any

    // Read the HTML template
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template not found at: ${TEMPLATE_PATH}`)
    }

    let htmlContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8')

    logger.info(`Generating contract for booking ${booking._id} using HTML template`)

    // Calculate total price and days
    const totalPrice = populatedBooking.price || 0
    const totalDays = calculateDays(populatedBooking.from, populatedBooking.to)
    const depositAmount = car?.deposit || 0

    // Replace placeholders with actual data
    const replacements: Record<string, string> = {
      // Logo
      '{{LOGO_BASE64}}': getLogoBase64(),
      
      // Car Diagram
      '{{CAR_DIAGRAM_BASE64}}': getCarDiagramBase64(),
      
      // Contract number
      '{{CONTRACT_NUMBER}}': contractNumber,
      
      // Driver information
      '{{DRIVER_NAME}}': driver?.fullName || '',
      '{{DRIVER_BIRTHDATE}}': driver?.birthDate ? formatDate(driver.birthDate) : '',
      '{{DRIVER_PHONE}}': driver?.phone || '',
      '{{DRIVER_NATIONALITY}}': 'Tunisienne',
      '{{DRIVER_ADDRESS}}': driver?.address || '',
      '{{CIN_CHECK}}': driver?.cinNumber ? '✓' : '',
      '{{PASSPORT_CHECK}}': '',
      '{{OTHER_CHECK}}': '',
      '{{ID_NUMBER}}': driver?.cinNumber || '',
      '{{LICENSE_NUMBER}}': driver?.driverLicenseNumber || '',
      '{{LICENSE_DATE}}': driver?.driverLicenseIssueDate ? formatDate(driver.driverLicenseIssueDate) : '',
      
      // Additional driver
      '{{ADDITIONAL_NAME}}': additionalDriver?.fullName || '',
      '{{ADDITIONAL_BIRTHDATE}}': additionalDriver?.birthDate ? formatDate(additionalDriver.birthDate) : '',
      '{{ADDITIONAL_PHONE}}': additionalDriver?.phone || '',
      '{{ADDITIONAL_NATIONALITY}}': additionalDriver ? 'Tunisienne' : '',
      '{{ADDITIONAL_ADDRESS}}': additionalDriver?.address || '',
      '{{ADDITIONAL_ID}}': additionalDriver?.cinNumber || '',
      '{{ADDITIONAL_LICENSE}}': additionalDriver?.driverLicenseNumber || '',
      '{{ADDITIONAL_LICENSE_DATE}}': additionalDriver?.driverLicenseIssueDate ? formatDate(additionalDriver.driverLicenseIssueDate) : '',
      
      // Vehicle information
      '{{CAR_NAME}}': car?.name || '',
      '{{CAR_PLATE}}': car?.immatriculation || '',
      
      // Dates
      '{{PICKUP_DATE}}': formatDate(populatedBooking.from),
      '{{PICKUP_TIME}}': formatTime(populatedBooking.from),
      '{{PICKUP_LOCATION}}': pickupLocation?.name || '',
      '{{RETURN_DATE}}': formatDate(populatedBooking.to),
      '{{RETURN_TIME}}': formatTime(populatedBooking.to),
      '{{RETURN_LOCATION}}': dropOffLocation?.name || pickupLocation?.name || '',
      
      // Payment
      '{{PAYMENT_DATE}}': formatDate(new Date()),
      '{{TOTAL_PRICE}}': formatCurrency(totalPrice),
      '{{PAYMENT_METHOD}}': '',
      
      // Mileage
      '{{KM_START}}': '0',
      
      // Deposit
      '{{DEPOSIT_AMOUNT}}': depositAmount > 0 ? formatCurrency(depositAmount) : '',
      '{{DEPOSIT_METHOD}}': depositAmount > 0 ? 'Carte' : '',
      
      // Total days
      '{{TOTAL_DAYS}}': `${totalDays} jour${totalDays > 1 ? 's' : ''}`,
      
      // Signature date (dynamic - date contract was generated)
      '{{SIGNATURE_DATE}}': formatDate(new Date()),
    }

    // Apply all replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--single-process',
      ],
    })

    try {
      const page = await browser.newPage()
      
      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      })

      // Generate PDF
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      })

      logger.info(`PDF file saved: ${filePath}`)
    } finally {
      await browser.close()
    }

    // Get file size
    const stats = fs.statSync(filePath)

    // Create contract record
    const contract = await Contract.create({
      booking: booking._id,
      contractNumber,
      fileName,
      filePath,
      fileSize: stats.size,
      generatedAt: new Date(),
      customer: driver._id,
      supplier: supplier._id,
    })

    logger.info(`Contract generated successfully: ${contractNumber}`)
    return contract
  } catch (err) {
    logger.error('Error generating contract:', err)
    throw err
  }
}

/**
 * Get contract by booking ID
 */
export const getContractByBooking = async (bookingId: string): Promise<bookcarsTypes.Contract | null> => {
  return Contract.findOne({ booking: bookingId })
    .populate('customer')
    .populate('supplier')
    .lean()
}

/**
 * Get all contracts with pagination and search
 */
export const getContracts = async (page: number, size: number, search: string): Promise<bookcarsTypes.Data<bookcarsTypes.Contract>> => {
  try {
    const skip = (page - 1) * size
    
    let query: any = {}
    
    if (search) {
      // First, get matching customer IDs
      const User = (await import('../models/User.js')).default
      const matchingCustomers = await User.find(
        { fullName: { $regex: search, $options: 'i' } },
        { _id: 1 }
      ).lean()
      const customerIds = matchingCustomers.map((c: any) => c._id)
      
      // Get matching bookings by car immatriculation
      const Car = (await import('../models/Car.js')).default
      const matchingCars = await Car.find(
        { immatriculation: { $regex: search, $options: 'i' } },
        { _id: 1 }
      ).lean()
      const carIds = matchingCars.map((c: any) => c._id)
      
      const matchingBookings = await Booking.find(
        { car: { $in: carIds } },
        { _id: 1 }
      ).lean()
      const bookingIds = matchingBookings.map((b: any) => b._id)
      
      // Build search query with OR conditions
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } },
        { booking: { $in: bookingIds } },
      ]
    }

    // Get contracts with populated references
    const contracts = await Contract.find(query)
      .populate('customer', 'fullName email')
      .populate('supplier', 'fullName')
      .populate({
        path: 'booking',
        populate: [
          { path: 'car', select: 'name immatriculation' },
          { path: 'driver', select: 'fullName' }
        ]
      })
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(size)
      .lean()

    const count = await Contract.countDocuments(query)

    return {
      rows: contracts as bookcarsTypes.Contract[],
      rowCount: count,
    }
  } catch (err) {
    logger.error('Error getting contracts:', err)
    throw err
  }
}

/**
 * Get contract file stream
 */
export const getContractFile = (filePath: string): fs.ReadStream => {
  const fullPath = path.join(CONTRACTS_DIR, path.basename(filePath))
  if (!fs.existsSync(fullPath)) {
    throw new Error('Contract file not found')
  }
  return fs.createReadStream(fullPath)
}

/**
 * Delete contract
 */
export const deleteContract = async (contractId: string): Promise<boolean> => {
  try {
    const contract = await Contract.findById(contractId).lean<bookcarsTypes.Contract>()
    if (!contract) {
      return false
    }

    // Delete file
    const fullPath = path.join(CONTRACTS_DIR, path.basename(contract.filePath))
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }

    // Delete database record
    await Contract.deleteOne({ _id: contractId })
    
    logger.info(`Contract deleted: ${contract.contractNumber}`)
    return true
  } catch (err) {
    logger.error('Error deleting contract:', err)
    throw err
  }
}
