import express from 'express'
import routeNames from '../config/contractRoutes.config.js'
import authJwt from '../middlewares/authJwt.js'
import * as contractController from '../controllers/contractController.js'

const routes = express.Router()

routes.route(routeNames.getContracts).get(authJwt.verifyToken, contractController.getContracts)
routes.route(routeNames.generateContract).post(authJwt.verifyToken, contractController.generateContract)
routes.route(routeNames.getContractByBooking).get(authJwt.verifyToken, contractController.getContractByBooking)
routes.route(routeNames.downloadContract).get(authJwt.verifyToken, contractController.downloadContract)
routes.route(routeNames.deleteContract).delete(authJwt.verifyToken, contractController.deleteContract)

export default routes
