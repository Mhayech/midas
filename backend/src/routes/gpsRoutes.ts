import express from 'express'
import routeNames from '../config/gpsRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as gpsController from '../controllers/gpsController'

const routes = express.Router()

/**
 * Get all GPS devices
 * Requires authentication
 */
routes.route(routeNames.devices).get(authJwt.verifyToken, gpsController.getDevices)

/**
 * Get GPS positions for devices
 * Requires authentication
 * Query params: deviceId (optional), resolveAddress (optional)
 */
routes.route(routeNames.positions).get(authJwt.verifyToken, gpsController.getPositions)

/**
 * Get GPS alarms
 * Requires authentication
 */
routes.route(routeNames.alarms).get(authJwt.verifyToken, gpsController.getAlarms)

/**
 * Reset GPS alarms
 * Requires authentication
 */
routes.route(routeNames.resetAlarms).delete(authJwt.verifyToken, gpsController.resetAlarms)

export default routes
