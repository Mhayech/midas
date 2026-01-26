import { Request, Response } from 'express'
import * as logger from '../utils/logger'
import gpsService from '../services/gpsService'

/**
 * Get all GPS devices.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getDevices = async (req: Request, res: Response) => {
  try {
    // Check if GPS service is configured
    if (!gpsService.isConfigured()) {
      res.status(503).send({ 
        error: 'GPS service is not configured. Please set FLEETISSAFE_API_TOKEN environment variable.' 
      })
      return
    }

    const devices = await gpsService.getDevices()
    res.json(devices)
  } catch (err) {
    logger.error('[gps.getDevices]', err)
    res.status(500).send({ error: 'Failed to fetch GPS devices' })
  }
}

/**
 * Get GPS positions for devices.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getPositions = async (req: Request, res: Response) => {
  try {
    // Check if GPS service is configured
    if (!gpsService.isConfigured()) {
      res.status(503).send({ 
        error: 'GPS service is not configured. Please set FLEETISSAFE_API_TOKEN environment variable.' 
      })
      return
    }

    // Extract query parameters
    const { deviceId, resolveAddress } = req.query
    
    let deviceIds: number[] | undefined
    if (deviceId) {
      // Handle both single device ID and array of device IDs
      if (Array.isArray(deviceId)) {
        deviceIds = deviceId.map(id => parseInt(String(id), 10))
      } else {
        deviceIds = [parseInt(String(deviceId), 10)]
      }
    }

    const shouldResolveAddress = resolveAddress === 'true' || resolveAddress === '1'

    const positions = await gpsService.getPositions(deviceIds, shouldResolveAddress)
    res.json(positions)
  } catch (err) {
    logger.error('[gps.getPositions]', err)
    res.status(500).send({ error: 'Failed to fetch GPS positions' })
  }
}

/**
 * Get GPS alarms.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getAlarms = async (req: Request, res: Response) => {
  try {
    // Check if GPS service is configured
    if (!gpsService.isConfigured()) {
      res.status(503).send({ 
        error: 'GPS service is not configured. Please set FLEETISSAFE_API_TOKEN environment variable.' 
      })
      return
    }

    const alarms = await gpsService.getAlarms()
    res.json(alarms)
  } catch (err) {
    logger.error('[gps.getAlarms]', err)
    res.status(500).send({ error: 'Failed to fetch GPS alarms' })
  }
}

/**
 * Reset GPS alarms.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const resetAlarms = async (req: Request, res: Response) => {
  try {
    // Check if GPS service is configured
    if (!gpsService.isConfigured()) {
      res.status(503).send({ 
        error: 'GPS service is not configured. Please set FLEETISSAFE_API_TOKEN environment variable.' 
      })
      return
    }

    await gpsService.resetAlarms()
    res.sendStatus(200)
  } catch (err) {
    logger.error('[gps.resetAlarms]', err)
    res.status(500).send({ error: 'Failed to reset GPS alarms' })
  }
}
