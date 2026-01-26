import axiosInstance from './axiosInstance'

/**
 * GPS Device
 */
export interface GPSDevice {
  id: number
  name: string
  uniqueId: string
  status: string
  disabled: boolean
  lastUpdate: string
  positionId: number
  groupId: number
  phone?: string
  model?: string
  contact?: string
  category?: string
  attributes: Record<string, any>
}

/**
 * GPS Position
 */
export interface GPSPosition {
  id: number
  attributes: Record<string, any>
  deviceId: number
  protocol: string
  creationTime: string
  fixTime: string
  valid: boolean
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
  address?: string | null
}

/**
 * Get all GPS devices
 */
export const getDevices = (): Promise<GPSDevice[]> =>
  axiosInstance
    .get('/api/gps/devices', { withCredentials: true })
    .then((res) => res.data)

/**
 * Get GPS positions
 * 
 * @param {number[]} [deviceIds] - Optional device IDs
 * @param {boolean} [resolveAddress=false] - Resolve coordinates to address
 */
export const getPositions = (deviceIds?: number[], resolveAddress: boolean = false): Promise<GPSPosition[]> => {
  const params: any = {}
  
  if (deviceIds && deviceIds.length > 0) {
    params.deviceId = deviceIds
  }
  
  if (resolveAddress) {
    params.resolveAddress = true
  }

  return axiosInstance
    .get('/api/gps/positions', { params, withCredentials: true })
    .then((res) => res.data)
}

/**
 * Get GPS alarms
 */
export const getAlarms = (): Promise<any[]> =>
  axiosInstance
    .get('/api/gps/alarms', { withCredentials: true })
    .then((res) => res.data)

/**
 * Reset GPS alarms
 */
export const resetAlarms = (): Promise<void> =>
  axiosInstance
    .delete('/api/gps/alarms', { withCredentials: true })
    .then((res) => res.data)
