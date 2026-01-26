import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

interface IStrings {
  STAFF_ACTIVITY_DASHBOARD: string
  MONITOR_PERFORMANCE: string
  NO_STAFF_MEMBERS: string
  CREATE_STAFF_ACCOUNTS: string
  TOTAL: string
  TODAY: string
  THIS_WEEK: string
  THIS_MONTH: string
  APPROVAL_RATE: string
  APPROVED: string
  PENDING: string
  REJECTED: string
  TOTAL_REVENUE: string
  PERFORMANCE_SUMMARY: string
  STAFF_MEMBER: string
  TOTAL_BOOKINGS: string
}

const strings = new LocalizedStrings({
  en: {
    STAFF_ACTIVITY_DASHBOARD: 'Staff Activity Dashboard',
    MONITOR_PERFORMANCE: 'Monitor performance and track metrics for all staff members',
    NO_STAFF_MEMBERS: 'No staff members found',
    CREATE_STAFF_ACCOUNTS: 'Create staff accounts to start tracking their activity',
    TOTAL: 'total',
    TODAY: 'Today',
    THIS_WEEK: 'This Week',
    THIS_MONTH: 'This Month',
    APPROVAL_RATE: 'Approval Rate',
    APPROVED: 'Approved',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    TOTAL_REVENUE: 'Total Revenue',
    PERFORMANCE_SUMMARY: 'Performance Summary',
    STAFF_MEMBER: 'Staff Member',
    TOTAL_BOOKINGS: 'Total Bookings',
  },
  fr: {
    STAFF_ACTIVITY_DASHBOARD: 'Tableau de bord d\'activité du personnel',
    MONITOR_PERFORMANCE: 'Surveiller les performances et suivre les métriques de tous les membres du personnel',
    NO_STAFF_MEMBERS: 'Aucun membre du personnel trouvé',
    CREATE_STAFF_ACCOUNTS: 'Créez des comptes de personnel pour commencer à suivre leur activité',
    TOTAL: 'total',
    TODAY: 'Aujourd\'hui',
    THIS_WEEK: 'Cette semaine',
    THIS_MONTH: 'Ce mois-ci',
    APPROVAL_RATE: 'Taux d\'approbation',
    APPROVED: 'Approuvé',
    PENDING: 'En attente',
    REJECTED: 'Rejeté',
    TOTAL_REVENUE: 'Revenu total',
    PERFORMANCE_SUMMARY: 'Résumé des performances',
    STAFF_MEMBER: 'Membre du personnel',
    TOTAL_BOOKINGS: 'Réservations totales',
  },
  es: {
    STAFF_ACTIVITY_DASHBOARD: 'Panel de actividad del personal',
    MONITOR_PERFORMANCE: 'Monitorear el rendimiento y realizar un seguimiento de las métricas de todos los miembros del personal',
    NO_STAFF_MEMBERS: 'No se encontraron miembros del personal',
    CREATE_STAFF_ACCOUNTS: 'Cree cuentas de personal para comenzar a realizar un seguimiento de su actividad',
    TOTAL: 'total',
    TODAY: 'Hoy',
    THIS_WEEK: 'Esta semana',
    THIS_MONTH: 'Este mes',
    APPROVAL_RATE: 'Tasa de aprobación',
    APPROVED: 'Aprobado',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazado',
    TOTAL_REVENUE: 'Ingresos totales',
    PERFORMANCE_SUMMARY: 'Resumen de rendimiento',
    STAFF_MEMBER: 'Miembro del personal',
    TOTAL_BOOKINGS: 'Reservas totales',
  }
})

langHelper.setLanguage(strings)
export { strings }
