import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Create a Booking.
 *
 * @param {bookcarsTypes.UpsertBookingPayload} data
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const create = (data: bookcarsTypes.UpsertBookingPayload): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .post(
      '/api/create-booking',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Booking.
 *
 * @param {bookcarsTypes.UpsertBookingPayload} data
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const update = (data: bookcarsTypes.UpsertBookingPayload): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .put(
      '/api/update-booking',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Booking status.
 *
 * @param {bookcarsTypes.UpdateStatusPayload} data
 * @returns {Promise<number>}
 */
export const updateStatus = (data: bookcarsTypes.UpdateStatusPayload): Promise<number> =>
  axiosInstance
    .post(
      '/api/update-booking-status',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Delete Bookings.
 *
 * @param {string[]} ids
 * @returns {Promise<number>}
 */
export const deleteBookings = (ids: string[]): Promise<number> =>
  axiosInstance
    .post(
      '/api/delete-bookings',
      ids,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get a Booking by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const getBooking = (id: string): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .get(
      `/api/booking/${encodeURIComponent(id)}/${UserService.getLanguage()}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Bookings.
 *
 * @param {bookcarsTypes.GetBookingsPayload} payload
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Booking>>}
 */
export const getBookings = (payload: bookcarsTypes.GetBookingsPayload, page: number, size: number): Promise<bookcarsTypes.Result<bookcarsTypes.Booking>> =>
  axiosInstance
    .post(
      `/api/bookings/${page}/${size}/${UserService.getLanguage()}`,
      payload,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get bookings pending approval.
 *
 * @returns {Promise<bookcarsTypes.Booking[]>}
 */
export const getPendingApprovals = (): Promise<bookcarsTypes.Booking[]> =>
  axiosInstance
    .get(
      '/api/pending-approvals',
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Approve a booking.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} [notes]
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const approveBooking = (id: string, userId: string, notes?: string): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .post(
      `/api/approve-booking/${encodeURIComponent(id)}`,
      { userId, notes },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Reject a booking.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} [notes]
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const rejectBooking = (id: string, userId: string, notes?: string): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .post(
      `/api/reject-booking/${encodeURIComponent(id)}`,
      { userId, notes },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get staff activity and performance metrics.
 *
 * @returns {Promise<any[]>}
 */
export const getStaffActivity = (): Promise<any[]> =>
  axiosInstance
    .get('/api/staff-activity', { withCredentials: true })
    .then((res) => res.data)
