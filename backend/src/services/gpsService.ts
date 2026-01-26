import axios, { AxiosInstance } from 'axios'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'

/**
 * FleetIsSafe GPS Device
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
 * FleetIsSafe GPS Position
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
 * Axios instance for FleetIsSafe API
 */
class GPSService {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: env.FLEETISSAFE_API_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(env.FLEETISSAFE_API_TOKEN && {
          'Authorization': `Bearer ${env.FLEETISSAFE_API_TOKEN}`
        }),
      },
      timeout: 10000,
    })

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('[gpsService] API Error:', error.message)
        if (error.response) {
          logger.error('[gpsService] Response:', error.response.data)
        }
        throw error
      }
    )
  }

  /**
   * Get all devices for the authenticated user
   * 
   * @returns {Promise<GPSDevice[]>}
   */
  async getDevices(): Promise<GPSDevice[]> {
    try {
      const response = await this.axiosInstance.get<GPSDevice[]>('/devices')
      return response.data
    } catch (error) {
      logger.error('[gpsService.getDevices] Error fetching devices:', error)
      throw error
    }
  }

  /**
   * Get last known positions for all devices or specific device(s)
   * 
   * @param {number[]} [deviceIds] - Optional array of device IDs
   * @param {boolean} [resolveAddress=false] - Whether to resolve lat/lng to address
   * @returns {Promise<GPSPosition[]>}
   */
  async getPositions(deviceIds?: number[], resolveAddress: boolean = false): Promise<GPSPosition[]> {
    try {
      const params: any = {}
      
      if (deviceIds && deviceIds.length > 0) {
        params.deviceId = deviceIds
      }
      
      if (resolveAddress) {
        params.resolveAddress = true
      }

      const response = await this.axiosInstance.get<GPSPosition[]>('/positions', { params })
      return response.data
    } catch (error) {
      logger.error('[gpsService.getPositions] Error fetching positions:', error)
      throw error
    }
  }

  /**
   * Get position by position ID(s)
   * 
   * @param {number[]} positionIds - Array of position IDs
   * @param {boolean} [resolveAddress=false] - Whether to resolve lat/lng to address
   * @returns {Promise<GPSPosition[]>}
   */
  async getPositionsByIds(positionIds: number[], resolveAddress: boolean = false): Promise<GPSPosition[]> {
    try {
      const params: any = {
        id: positionIds,
      }
      
      if (resolveAddress) {
        params.resolveAddress = true
      }

      const response = await this.axiosInstance.get<GPSPosition[]>('/positions', { params })
      return response.data
    } catch (error) {
      logger.error('[gpsService.getPositionsByIds] Error fetching positions by IDs:', error)
      throw error
    }
  }

  /**
   * Get unviewed alarms
   * 
   * @returns {Promise<any[]>}
   */
  async getAlarms(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/alarms')
      return response.data
    } catch (error) {
      logger.error('[gpsService.getAlarms] Error fetching alarms:', error)
      throw error
    }
  }

  /**
   * Reset unviewed alarms
   * 
   * @returns {Promise<void>}
   */
  async resetAlarms(): Promise<void> {
    try {
      await this.axiosInstance.delete('/alarms')
    } catch (error) {
      logger.error('[gpsService.resetAlarms] Error resetting alarms:', error)
      throw error
    }
  }

  /**
   * Check if GPS service is configured
   * 
   * @returns {boolean}
   */
  isConfigured(): boolean {
    return !!env.FLEETISSAFE_API_TOKEN
  }
}

export default new GPSService()
