import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as authHelper from '../utils/authHelper'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import User from '../models/User'

/**
 * Check if user has required role(s) to access a route.
 *
 * @param {bookcarsTypes.UserType[]} allowedRoles - Array of allowed user types
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles: bookcarsTypes.UserType[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string
      const isAdmin = authHelper.isAdmin(req)
      const isFrontend = authHelper.isFrontend(req)

      if (isAdmin) {
        token = req.signedCookies[env.ADMIN_AUTH_COOKIE_NAME] as string
      } else if (isFrontend) {
        token = req.signedCookies[env.FRONTEND_AUTH_COOKIE_NAME] as string
      } else {
        token = req.headers[env.X_ACCESS_TOKEN] as string
      }

      if (!token) {
        logger.info('[roleCheck] No token provided')
        res.status(403).send({ message: 'No token provided!' })
        return
      }

      const sessionData = await authHelper.decryptJWT(token)
      
      if (!sessionData || !helper.isValidObjectId(sessionData.id)) {
        logger.info('[roleCheck] Invalid session data')
        res.status(401).send({ message: 'Unauthorized!' })
        return
      }

      const user = await User.findById(sessionData.id).lean()

      if (!user) {
        logger.info('[roleCheck] User not found')
        res.status(401).send({ message: 'Unauthorized!' })
        return
      }

      // Check if user's type is in allowed roles
      if (!allowedRoles.includes(user.type as bookcarsTypes.UserType)) {
        logger.info(`[roleCheck] Access denied: User ${user.email} (${user.type}) tried to access route requiring roles: ${allowedRoles.join(', ')}`)
        res.status(403).send({ message: 'Access denied! Insufficient permissions.' })
        return
      }

      // User has required role, proceed
      next()
    } catch (err) {
      logger.error('[roleCheck] Error checking user role:', err)
      res.status(500).send({ message: 'Internal server error' })
    }
  }
}

/**
 * Check if user is Admin only
 */
export const requireAdmin = requireRole([bookcarsTypes.UserType.Admin])

/**
 * Check if user is Admin or Supplier
 */
export const requireAdminOrSupplier = requireRole([
  bookcarsTypes.UserType.Admin,
  bookcarsTypes.UserType.Supplier,
])

/**
 * Check if user is Admin or Agency Staff
 */
export const requireAdminOrStaff = requireRole([
  bookcarsTypes.UserType.Admin,
  bookcarsTypes.UserType.AgencyStaff,
])

/**
 * Check if user is Admin, Supplier, or Agency Staff
 */
export const requireAdminSupplierOrStaff = requireRole([
  bookcarsTypes.UserType.Admin,
  bookcarsTypes.UserType.Supplier,
  bookcarsTypes.UserType.AgencyStaff,
])

/**
 * Check if user is Accountant or Admin (for financial reports)
 */
export const requireAccountantOrAdmin = requireRole([
  bookcarsTypes.UserType.Admin,
  bookcarsTypes.UserType.Accountant,
])
