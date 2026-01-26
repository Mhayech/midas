import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import env from '@/config/env.config'

/**
 * Get contracts with pagination and search
 *
 * @param {number} page
 * @param {number} size
 * @param {string} [search]
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Contract>>}
 */
export const getContracts = async (
  page: number,
  size: number,
  search?: string
): Promise<bookcarsTypes.Data<bookcarsTypes.Contract>> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (search) {
    params.append('search', search)
  }

  const response = await axiosInstance.get<bookcarsTypes.Data<bookcarsTypes.Contract>>(
    `/api/contracts?${params.toString()}`
  )
  return response.data
}

/**
 * Get contract by booking ID
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Contract | null>}
 */
export const getContractByBooking = async (bookingId: string): Promise<bookcarsTypes.Contract | null> => {
  const response = await axiosInstance.get<bookcarsTypes.Contract>(
    `/api/contract/booking/${bookingId}`
  )
  return response.data
}

/**
 * Download contract PDF
 *
 * @param {string} bookingId
 * @returns {Promise<void>}
 */
export const downloadContract = async (bookingId: string): Promise<void> => {
  const response = await fetch(`${env.API_HOST}/api/contract/download/${bookingId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to download contract')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contract-${bookingId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Delete contract
 *
 * @param {string} contractId
 * @returns {Promise<number>}
 */
export const deleteContract = async (contractId: string): Promise<number> => {
  const response = await axiosInstance.delete<number>(
    `/api/contract/${contractId}`
  )
  return response.status
}

/**
 * Generate contract for a booking
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Contract>}
 */
export const generateContract = async (bookingId: string): Promise<bookcarsTypes.Contract> => {
  const response = await axiosInstance.post<bookcarsTypes.Contract>(
    `/api/contract/generate/${bookingId}`,
    {}
  )
  return response.data
}
