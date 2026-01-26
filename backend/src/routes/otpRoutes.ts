import express from 'express'
import routeNames from '../config/otpRoutes.config'
import * as otpController from '../controllers/otpController'

const routes = express.Router()

routes.route(routeNames.sendOTP).post(otpController.sendOTP)
routes.route(routeNames.verifyOTP).post(otpController.verifyOTP)
routes.route(routeNames.resendOTP).post(otpController.resendOTP)

export default routes
