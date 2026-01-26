import axiosInstance from './axiosInstance'

/**
 * Get financial report data.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} [supplierId]
 * @returns {Promise<any>}
 */
export const getFinancialReport = (
  startDate: Date,
  endDate: Date,
  supplierId?: string
): Promise<any> =>
  axiosInstance
    .post(
      '/api/financial-report',
      { startDate, endDate, supplierId },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Export financial report to CSV.
 *
 * @param {string} reportType
 * @param {any[]} data
 * @returns {Promise<Blob>}
 */
export const exportFinancialReport = (
  reportType: string,
  data: any[]
): Promise<Blob> =>
  axiosInstance
    .post(
      '/api/export-financial-report',
      { reportType, data },
      { 
        withCredentials: true,
        responseType: 'blob'
      }
    )
    .then((res) => res.data)
