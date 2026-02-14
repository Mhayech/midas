import { toast } from 'react-toastify'
import { strings as commonStrings } from '@/lang/common'

/**
 * API Error Handler - provides user-friendly error messages
 */

interface ApiError {
  message?: string
  status?: number
  response?: {
    data?: string | { message?: string }
    status?: number
  }
}

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (err: unknown, context?: string): void => {
  if (console?.log) {
    console.error('[API Error]', context || 'Unknown context', err)
  }

  const apiError = err as ApiError
  let message = commonStrings.GENERIC_ERROR

  // Extract error message from different error formats
  if (apiError?.response?.data) {
    if (typeof apiError.response.data === 'string') {
      message = apiError.response.data
    } else if (apiError.response.data?.message) {
      message = apiError.response.data.message
    }
  } else if (apiError?.message) {
    message = apiError.message
  }

  // Add context if provided
  if (context) {
    message = `${context}: ${message}`
  }

  toast.error(message)
}

/**
 * Handle success messages
 */
export const handleSuccess = (message: string): void => {
  toast.success(message)
}

/**
 * Handle info messages
 */
export const handleInfo = (message: string): void => {
  toast.info(message)
}

/**
 * Handle warning messages
 */
export const handleWarning = (message: string): void => {
  toast.warning(message)
}

/**
 * Network error messages
 */
export const NETWORK_ERROR = 'Network error. Please check your connection.'
export const TIMEOUT_ERROR = 'Request timeout. Please try again.'
export const UNAUTHORIZED_ERROR = 'Unauthorized. Please sign in again.'
export const FORBIDDEN_ERROR = 'You do not have permission to perform this action.'
export const NOT_FOUND_ERROR = 'Resource not found.'
export const SERVER_ERROR = 'Server error. Please try again later.'

/**
 * Handle HTTP status code errors
 */
export const handleStatusError = (status: number): string => {
  switch (status) {
    case 401:
      return UNAUTHORIZED_ERROR
    case 403:
      return FORBIDDEN_ERROR
    case 404:
      return NOT_FOUND_ERROR
    case 500:
    case 502:
    case 503:
      return SERVER_ERROR
    case 408:
      return TIMEOUT_ERROR
    default:
      return commonStrings.GENERIC_ERROR
  }
}
