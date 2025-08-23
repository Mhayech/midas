import { Router } from 'express'
import multer from 'multer'
import * as carStateController from '../controllers/carStateController'
import authJwt from '../middlewares/authJwt'

const router = Router()

// Public routes (if any)
router.get('/get-car-states', carStateController.getCarStates)
router.get('/get-car-state/:id', carStateController.getCarState)
router.get('/get-car-states-by-car/:carId', carStateController.getCarStatesByCar)
router.get('/get-car-states-by-booking/:bookingId', carStateController.getCarStatesByBooking)
router.get('/compare-car-states/:bookingId', carStateController.compareStates)
router.get('/get-car-state-statistics', carStateController.getStatistics)

// Protected routes (require authentication)
router.post('/create-car-state', [authJwt.verifyToken], carStateController.create)
router.put('/update-car-state', [authJwt.verifyToken], carStateController.update)
router.delete('/delete-car-state/:id', [authJwt.verifyToken], carStateController.deleteCarState)

// Damage management
router.post('/add-car-state-damage/:id', [authJwt.verifyToken], carStateController.addDamage)
router.put('/update-car-state-damage/:id/:damageId', [authJwt.verifyToken], carStateController.updateDamage)
router.delete('/remove-car-state-damage/:id/:damageId', [authJwt.verifyToken], carStateController.removeDamage)

// Included items management
router.post('/add-car-state-included-item/:id', [authJwt.verifyToken], carStateController.addIncludedItem)
router.put('/update-car-state-included-item/:id/:itemIndex', [authJwt.verifyToken], carStateController.updateIncludedItem)
router.delete('/remove-car-state-included-item/:id/:itemIndex', [authJwt.verifyToken], carStateController.removeIncludedItem)

export default router
