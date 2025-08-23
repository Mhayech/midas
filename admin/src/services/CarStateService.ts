import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Create a Car State.
 *
 * @param {bookcarsTypes.CreateCarStatePayload} data
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const create = (data: bookcarsTypes.CreateCarStatePayload): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .post(
      '/create-car-state',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Car State.
 *
 * @param {bookcarsTypes.UpdateCarStatePayload} data
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const update = (data: bookcarsTypes.UpdateCarStatePayload): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .put(
      '/update-car-state',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Delete a Car State.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const deleteCarState = (id: string): Promise<number> =>
  axiosInstance
    .delete(
      `/delete-car-state/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get a Car State by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const getCarState = (id: string): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .get(
      `/get-car-state/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Car States with filters.
 *
 * @param {bookcarsTypes.GetCarStatesPayload} data
 * @returns {Promise<bookcarsTypes.GetCarStatesResponse>}
 */
export const getCarStates = (data: bookcarsTypes.GetCarStatesPayload): Promise<bookcarsTypes.GetCarStatesResponse> =>
  axiosInstance
    .get(
      '/get-car-states',
      {
        params: data,
        withCredentials: true
      }
    )
    .then((res) => res.data)

/**
 * Get Car States for a specific car.
 *
 * @param {string} carId
 * @param {string} stateType
 * @param {number} limit
 * @returns {Promise<bookcarsTypes.CarStateInfo[]>}
 */
export const getCarStatesByCar = (carId: string, stateType?: string, limit = 10): Promise<bookcarsTypes.CarStateInfo[]> =>
  axiosInstance
    .get(
      `/get-car-states-by-car/${encodeURIComponent(carId)}`,
      {
        params: { stateType, limit },
        withCredentials: true
      }
    )
    .then((res) => res.data)

/**
 * Get Car States for a specific booking.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.CarStateInfo[]>}
 */
export const getCarStatesByBooking = (bookingId: string): Promise<bookcarsTypes.CarStateInfo[]> =>
  axiosInstance
    .get(
      `/get-car-states-by-booking/${encodeURIComponent(bookingId)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Compare before and after states for a booking.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.CarStateComparison>}
 */
export const compareStates = (bookingId: string): Promise<bookcarsTypes.CarStateComparison> =>
  axiosInstance
    .get(
      `/compare-car-states/${encodeURIComponent(bookingId)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Add damage to a Car State.
 *
 * @param {string} id
 * @param {bookcarsTypes.DamageMarker} damage
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const addDamage = (id: string, damage: bookcarsTypes.DamageMarker): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .post(
      `/add-car-state-damage/${encodeURIComponent(id)}`,
      { damage },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update damage in a Car State.
 *
 * @param {string} id
 * @param {string} damageId
 * @param {Partial<bookcarsTypes.DamageMarker>} damage
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const updateDamage = (id: string, damageId: string, damage: Partial<bookcarsTypes.DamageMarker>): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .put(
      `/update-car-state-damage/${encodeURIComponent(id)}/${encodeURIComponent(damageId)}`,
      { damage },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Remove damage from a Car State.
 *
 * @param {string} id
 * @param {string} damageId
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const removeDamage = (id: string, damageId: string): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .delete(
      `/remove-car-state-damage/${encodeURIComponent(id)}/${encodeURIComponent(damageId)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Add included item to a Car State.
 *
 * @param {string} id
 * @param {bookcarsTypes.IncludedItem} item
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const addIncludedItem = (id: string, item: bookcarsTypes.IncludedItem): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .post(
      `/add-car-state-included-item/${encodeURIComponent(id)}`,
      { item },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update included item in a Car State.
 *
 * @param {string} id
 * @param {number} itemIndex
 * @param {Partial<bookcarsTypes.IncludedItem>} item
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const updateIncludedItem = (id: string, itemIndex: number, item: Partial<bookcarsTypes.IncludedItem>): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .put(
      `/update-car-state-included-item/${encodeURIComponent(id)}/${itemIndex}`,
      { item },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Remove included item from a Car State.
 *
 * @param {string} id
 * @param {number} itemIndex
 * @returns {Promise<bookcarsTypes.CarStateInfo>}
 */
export const removeIncludedItem = (id: string, itemIndex: number): Promise<bookcarsTypes.CarStateInfo> =>
  axiosInstance
    .delete(
      `/remove-car-state-included-item/${encodeURIComponent(id)}/${itemIndex}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Car State statistics.
 *
 * @param {string} from
 * @param {string} to
 * @returns {Promise<bookcarsTypes.CarStateStatistics>}
 */
export const getStatistics = (from?: string, to?: string): Promise<bookcarsTypes.CarStateStatistics> =>
  axiosInstance
    .get(
      '/get-car-state-statistics',
      {
        params: { from, to },
        withCredentials: true
      }
    )
    .then((res) => res.data)

/**
 * Create a temporary Car State image.
 *
 * @param {Blob} file
 * @returns {Promise<string>}
 */
export const createImage = (file: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)

  return axiosInstance
    .post(
      '/create-car-state-image',
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      },
    )
    .then((res) => res.data)
}

/**
 * Update a Car State image.
 *
 * @param {string} id
 * @param {Blob} file
 * @returns {Promise<number>}
 */
export const updateImage = (id: string, file: Blob): Promise<number> => {
  const formData = new FormData()
  formData.append('image', file)

  return axiosInstance
    .post(
      `/update-car-state-image/${encodeURIComponent(id)}`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      },
    )
    .then((res) => res.status)
}
