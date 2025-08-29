import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: "Gestion Véhicule",
    BACK: 'Retour',
    SUMMARY: 'Résumé',
    CAR: 'Voiture',
    REGISTRATION: 'Immatriculation',
    MILEAGE: 'Kilométrage',
    LOCATION: 'Lieu',
    ADDRESS: 'Adresse',
    BOOKING: 'Réservation',
    DRIVER: 'Conducteur',
    FROM: 'De',
    TO: 'À',
    PRICE_TOTAL: 'Total',
    PRICE_PER_DAY: 'Prix par jour',
    PRINT: 'Imprimer',
    SUPPLIER: 'Fournisseur',
  },
  en: {
    TITLE: 'Car Management',
    BACK: 'Back',
    SUMMARY: 'Summary',
    CAR: 'Car',
    REGISTRATION: 'Registration',
    MILEAGE: 'Mileage',
    LOCATION: 'Location',
    ADDRESS: 'Address',
    BOOKING: 'Booking',
    DRIVER: 'Driver',
    FROM: 'From',
    TO: 'To',
    PRICE_TOTAL: 'Total',
    PRICE_PER_DAY: 'Price per day',
    PRINT: 'Print',
    SUPPLIER: 'Supplier',
  },
  es: {
    TITLE: 'Gestión del vehículo',
    BACK: 'Atrás',
    SUMMARY: 'Resumen',
    CAR: 'Coche',
    REGISTRATION: 'Matrícula',
    MILEAGE: 'Kilometraje',
    LOCATION: 'Ubicación',
    ADDRESS: 'Dirección',
    BOOKING: 'Reserva',
    DRIVER: 'Conductor',
    FROM: 'Desde',
    TO: 'Hasta',
    PRICE_TOTAL: 'Total',
    PRICE_PER_DAY: 'Precio por día',
    PRINT: 'Imprimir',
    SUPPLIER: 'Proveedor',
  },
})

langHelper.setLanguage(strings)
export { strings }


