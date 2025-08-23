import { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import CarState from '../models/CarState'
import Car from '../models/Car'
import Booking from '../models/Booking'
import Location from '../models/Location'
import User from '../models/User'
import i18n from '../lang/i18n'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'

/**
 * Create a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.CreateCarStatePayload } = req

  try {
    const carState = new CarState(body)
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.create: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Update a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.UpdateCarStatePayload } = req

  try {
    const { _id } = body

    if (!_id) {
      throw new Error('Car State ID is required')
    }

    const carState = await CarState.findByIdAndUpdate(
      _id,
      { ...body },
      { new: true, runValidators: true }
    )

    if (!carState) {
      throw new Error('Car State not found')
    }

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.update: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Upload a temporary Car State photo. Reuse car image upload flow for storage.
 */
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    // Delegate to carController-like helper is not present; return 501 for now
    res.status(501).json({ error: 'Not Implemented' })
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Delete a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteCarState = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const carState = await CarState.findByIdAndDelete(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    res.status(200).json({ message: 'Car State deleted successfully' })
  } catch (err) {
    logger.error(`carStateController.deleteCarState: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Get a Car State by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCarState = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const carState = await CarState.findById(id)
      .populate('car')
      .populate('booking')
      .populate('location')
      .populate('admin', 'fullName')
      .populate('verifiedBy', 'fullName')

    if (!carState) {
      throw new Error('Car State not found')
    }

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.getCarState: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Get Car States with filters.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCarStates = async (req: Request, res: Response) => {
  const { car, booking, stateType, location, from, to, page = 1, limit = 20 } = req.query

  try {
    const filter: any = {}

    if (car) filter.car = car
    if (booking) filter.booking = booking
    if (stateType) filter.stateType = stateType
    if (location) filter.location = location
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from as string)
      if (to) filter.date.$lte = new Date(to as string)
    }

    const skip = (Number(page) - 1) * Number(limit)

    const carStates = await CarState.find(filter)
      .populate('car')
      .populate('booking')
      .populate('location')
      .populate('admin', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await CarState.countDocuments(filter)

    res.status(200).json({
      carStates,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    })
  } catch (err) {
    logger.error(`carStateController.getCarStates: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Get Car States for a specific car.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCarStatesByCar = async (req: Request, res: Response) => {
  const { carId } = req.params
  const { stateType, limit = 10 } = req.query

  try {
    const filter: any = { car: carId }
    if (stateType) filter.stateType = stateType

    const carStates = await CarState.find(filter)
      .populate('booking')
      .populate('location')
      .populate('admin', 'fullName')
      .sort({ date: -1 })
      .limit(Number(limit))

    res.status(200).json(carStates)
  } catch (err) {
    logger.error(`carStateController.getCarStatesByCar: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Get Car States for a specific booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCarStatesByBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params

  try {
    const carStates = await CarState.find({ booking: bookingId })
      .populate('car')
      .populate('location')
      .populate('admin', 'fullName')
      .sort({ date: -1 })

    res.status(200).json(carStates)
  } catch (err) {
    logger.error(`carStateController.getCarStatesByBooking: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Compare before and after states for a booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const compareStates = async (req: Request, res: Response) => {
  const { bookingId } = req.params

  try {
    const beforeState = await CarState.findOne({
      booking: bookingId,
      stateType: bookcarsTypes.CarState.PreRental
    }).populate('car location admin')

    const afterState = await CarState.findOne({
      booking: bookingId,
      stateType: bookcarsTypes.CarState.PostRental
    }).populate('car location admin')

    res.status(200).json({
      beforeState,
      afterState,
      hasComparison: !!(beforeState && afterState)
    })
  } catch (err) {
    logger.error(`carStateController.compareStates: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Add damage to a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const addDamage = async (req: Request, res: Response) => {
  const { id } = req.params
  const { damage } = req.body

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    carState.damages.push(damage)
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.addDamage: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Update damage in a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateDamage = async (req: Request, res: Response) => {
  const { id, damageId } = req.params
  const { damage } = req.body

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    const damageIndex = carState.damages.findIndex(d => d.id === damageId)
    if (damageIndex === -1) {
      throw new Error('Damage not found')
    }

    carState.damages[damageIndex] = { ...carState.damages[damageIndex], ...damage }
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.updateDamage: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Remove damage from a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const removeDamage = async (req: Request, res: Response) => {
  const { id, damageId } = req.params

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    carState.damages = carState.damages.filter(d => d.id !== damageId)
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.removeDamage: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Add included item to a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const addIncludedItem = async (req: Request, res: Response) => {
  const { id } = req.params
  const { item } = req.body

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    carState.includedItems.push(item)
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.addIncludedItem: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Update included item in a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateIncludedItem = async (req: Request, res: Response) => {
  const { id, itemIndex } = req.params
  const { item } = req.body

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    const index = Number(itemIndex)
    if (index < 0 || index >= carState.includedItems.length) {
      throw new Error('Invalid item index')
    }

    carState.includedItems[index] = { ...carState.includedItems[index], ...item }
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.updateIncludedItem: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Remove included item from a Car State.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const removeIncludedItem = async (req: Request, res: Response) => {
  const { id, itemIndex } = req.params

  try {
    const carState = await CarState.findById(id)

    if (!carState) {
      throw new Error('Car State not found')
    }

    const index = Number(itemIndex)
    if (index < 0 || index >= carState.includedItems.length) {
      throw new Error('Invalid item index')
    }

    carState.includedItems.splice(index, 1)
    await carState.save()

    res.status(200).json(carState)
  } catch (err) {
    logger.error(`carStateController.removeIncludedItem: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Get Car State statistics.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getStatistics = async (req: Request, res: Response) => {
  const { from, to } = req.query

  try {
    const filter: any = {}
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from as string)
      if (to) filter.date.$lte = new Date(to as string)
    }

    const stats = await CarState.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$stateType',
          count: { $sum: 1 },
          avgMileage: { $avg: '$mileage' },
          avgFuelLevel: { $avg: '$fuelLevel' }
        }
      }
    ])

    const totalStates = await CarState.countDocuments(filter)
    const totalDamages = await CarState.aggregate([
      { $match: filter },
      { $unwind: '$damages' },
      { $count: 'total' }
    ])

    res.status(200).json({
      stats,
      totalStates,
      totalDamages: totalDamages[0]?.total || 0
    })
  } catch (err) {
    logger.error(`carStateController.getStatistics: ${err}`)
    res.status(400).json({ error: (err as Error).message })
  }
}
