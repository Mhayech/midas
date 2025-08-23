import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: "Gestion de l'état du véhicule",
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
  },
  en: {
    TITLE: 'Car State Management',
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
  },
  es: {
    TITLE: 'Gestión del estado del vehículo',
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
  },
})

langHelper.setLanguage(strings)
export { strings }


