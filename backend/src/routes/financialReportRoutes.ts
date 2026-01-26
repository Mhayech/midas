import express from 'express'
import routeNames from '../config/financialReportRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as roleCheck from '../middlewares/roleCheck'
import * as financialReportController from '../controllers/financialReportController'

const routes = express.Router()

routes
  .route(routeNames.getFinancialReport)
  .post(authJwt.verifyToken, roleCheck.requireAccountantOrAdmin, financialReportController.getFinancialReport)

routes
  .route(routeNames.exportFinancialReport)
  .post(authJwt.verifyToken, roleCheck.requireAccountantOrAdmin, financialReportController.exportFinancialReport)

export default routes
