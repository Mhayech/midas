import { PDFDocument, PDFTextField, PDFCheckBox, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import * as logger from './logger.js'

const TEMPLATE_PATH = path.join(process.cwd(), 'template', 'CONTRAT MIDAS RENT CAR.pdf')
const OUTPUT_PATH = path.join(process.cwd(), 'template', 'CONTRAT-FILLABLE.pdf')

/**
 * This utility creates a fillable PDF template with form fields
 * Run this once to convert your static PDF to a fillable form
 */
export const createFillableTemplate = async (): Promise<void> => {
  try {
    logger.info('Creating fillable PDF template...')

    // Load the existing template
    const templateBytes = fs.readFileSync(TEMPLATE_PATH)
    const pdfDoc = await PDFDocument.load(templateBytes)
    
    const form = pdfDoc.getForm()
    const page = pdfDoc.getPages()[0]
    const { height } = page.getSize()

    // Define field positions based on your template
    // NOTE: pdf-lib uses bottom-left as origin, Y increases upward
    // Fine-tuned coordinates based on actual PDF layout
    const fields = [
      // LEFT COLUMN - Le Locataire (Driver info)
      { name: 'driverName', x: 195, y: 668, width: 205, height: 16 },
      { name: 'driverBirthDate', x: 195, y: 640, width: 205, height: 16 },
      { name: 'driverPhone', x: 195, y: 612, width: 205, height: 16 },
      { name: 'driverNationality', x: 195, y: 584, width: 205, height: 16 },
      { name: 'driverAddress', x: 195, y: 538, width: 205, height: 32 },
      { name: 'idNumber', x: 195, y: 488, width: 205, height: 16 },
      { name: 'licenseNumber', x: 195, y: 446, width: 205, height: 16 },
      { name: 'licenseIssueDate', x: 195, y: 404, width: 205, height: 16 },

      // Additional driver (2ème Conducteur)
      { name: 'additionalDriverName', x: 195, y: 351, width: 205, height: 16 },
      { name: 'additionalDriverBirthDate', x: 195, y: 323, width: 205, height: 16 },
      { name: 'additionalDriverPhone', x: 195, y: 295, width: 205, height: 16 },

      // RIGHT COLUMN - Véhicule (Vehicle)
      { name: 'carName', x: 458, y: 720, width: 140, height: 16 },
      { name: 'carPlate', x: 458, y: 688, width: 140, height: 16 },
      { name: 'pickupDateBox', x: 468, y: 656, width: 110, height: 16 },
      { name: 'returnDateBox', x: 628, y: 656, width: 110, height: 16 },

      // Durée table (Duration)
      { name: 'pickupDate', x: 513, y: 603, width: 68, height: 16 },
      { name: 'pickupTime', x: 585, y: 603, width: 50, height: 16 },
      { name: 'pickupLocation', x: 640, y: 603, width: 95, height: 16 },
      { name: 'returnDate', x: 513, y: 581, width: 68, height: 16 },
      { name: 'returnTime', x: 585, y: 581, width: 50, height: 16 },
      { name: 'returnLocation', x: 640, y: 581, width: 95, height: 16 },

      // Encaissement table (Payment)
      { name: 'paymentDate', x: 450, y: 532, width: 68, height: 16 },
      { name: 'totalPrice', x: 523, y: 532, width: 80, height: 16 },
      { name: 'paymentMethod', x: 608, y: 532, width: 125, height: 16 },

      // Kilométrage table (Mileage)
      { name: 'startKm', x: 450, y: 481, width: 145, height: 16 },

      // Contract number (top right)
      { name: 'contractNumber', x: 520, y: 777, width: 140, height: 16 },
    ]

    // Embed font for form fields
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Create text fields
    fields.forEach(field => {
      const textField = form.createTextField(field.name)
      textField.addToPage(page, {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        borderWidth: 0, // No border
        backgroundColor: rgb(1, 1, 1), // Transparent
      })
      textField.enableReadOnly()
      textField.defaultUpdateAppearances(helveticaFont)
    })

    // Add checkbox for CIN
    const cinCheckbox = form.createCheckBox('cinChecked')
    cinCheckbox.addToPage(page, {
      x: 215,
      y: 516,
      width: 10,
      height: 10,
      borderWidth: 0, // No border
    })

    // Save the fillable template
    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync(OUTPUT_PATH, pdfBytes)

    logger.info(`Fillable template created: ${OUTPUT_PATH}`)
    logger.info('Now use this fillable template for contract generation')
  } catch (err) {
    logger.error('Error creating fillable template:', err)
    throw err
  }
}

// Uncomment to run this script once
// createFillableTemplate().then(() => process.exit(0))
