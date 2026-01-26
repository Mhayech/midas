import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { Download as DownloadIcon } from '@mui/icons-material'
import { strings as csmStrings } from '@/lang/car-state-management'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as CarService from '@/services/CarService'
import * as BookingService from '@/services/BookingService'
import * as LocationService from '@/services/LocationService'
import CarStateReport from '@/components/CarStateReport'
import { strings as commonStrings } from '@/lang/common'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'

import '@/assets/css/car-state-management.css'

const CarStateManagement = () => {
  const { carId, bookingId } = useParams<{ carId?: string; bookingId?: string }>()
  const navigate = useNavigate()
  
  const [car, setCar] = useState<bookcarsTypes.Car | null>(null)
  const [booking, setBooking] = useState<bookcarsTypes.Booking | null>(null)
  const [location, setLocation] = useState<bookcarsTypes.Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use ref instead of state to avoid infinite re-renders
  const pdfGeneratorRef = useRef<(() => void) | null>(null)

  // Simple data loading function without useCallback to avoid circular dependencies
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (carId) {
        // Load car data
        const carData = await CarService.getCar(carId)
        setCar(carData)
        
        // Load location from car's first location
        if (carData.locations && carData.locations.length > 0) {
          const locationId = typeof carData.locations[0] === 'string' 
            ? carData.locations[0] 
            : carData.locations[0]._id
          if (locationId) {
            const locationData = await LocationService.getLocation(locationId)
            setLocation(locationData)
          }
        }
      }

      if (bookingId) {
        // Load booking data
        const bookingData = await BookingService.getBooking(bookingId)
        setBooking(bookingData)
        
        // Load car from booking
        if (bookingData.car) {
          const carId = typeof bookingData.car === 'string' 
            ? bookingData.car 
            : bookingData.car._id
          if (carId) {
            const carData = await CarService.getCar(carId)
            setCar(carData)
          }
        }
        
        // Load location from booking
        if (bookingData.pickupLocation) {
          const locationId = typeof bookingData.pickupLocation === 'string' 
            ? bookingData.pickupLocation 
            : bookingData.pickupLocation._id
          if (locationId) {
            const locationData = await LocationService.getLocation(locationId)
            setLocation(locationData)
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(csmStrings.FAILED_TO_LOAD_DATA)
    } finally {
      setLoading(false)
    }
  }

  // Load data when component mounts or when carId/bookingId changes
  useEffect(() => {
    loadData()
  }, [carId, bookingId])

  // State change handler - NO redirect, just refresh the data
  const handleStateChange = () => {
    // The CarStateReport component already reloads its own data via loadCarStates()
    // No redirect needed - user can create multiple states (pre-rental, post-rental) in one session
  }

  // PDF handler registration using ref to avoid infinite re-renders
  const registerPdfHandler = useCallback((fn: () => void) => {
    pdfGeneratorRef.current = fn
  }, [])

  // PDF generation handler
  const handlePdfGeneration = () => {
    // Clear console before PDF generation to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.clear()
    }
    
    if (pdfGeneratorRef.current) {
      pdfGeneratorRef.current()
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          {csmStrings.GO_BACK}
        </Button>
      </Box>
    )
  }

  if (!car || !location) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {csmStrings.CAR_OR_LOCATION_NOT_FOUND}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          {csmStrings.GO_BACK}
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ px: 2, py: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            {csmStrings.BACK}
          </Button>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handlePdfGeneration}
            aria-label={csmStrings.PRINT}
          >
            {csmStrings.PRINT}
          </Button>
        </Box>
      </Box>

      {/* Title outside the card */}
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ mb: 3 }}
      >
        {csmStrings.TITLE}
      </Typography>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }} className="csm-hero">
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
            {csmStrings.SUMMARY}
          </Typography>

          <Grid container spacing={2} alignItems="flex-start">
            {/* Left Column: Car Details */}
            <Grid item xs={12} md={5}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                {csmStrings.CAR}
              </Typography>
              <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                {car.name}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                {csmStrings.REGISTRATION}
              </Typography>
              <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                {car.immatriculation || csmStrings.N_A}
              </Typography>

              {car.supplier?.fullName && (
                <>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                    {csmStrings.SUPPLIER}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                    {car.supplier.fullName}
                  </Typography>
                </>
              )}
            </Grid>

            {/* Right Column: Location and Booking */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {/* Location */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                    {csmStrings.LOCATION}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                    {location.name}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                    {csmStrings.ADDRESS}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                    {location.latitude != null && location.longitude != null
                      ? csmStrings.COORDINATES_FORMAT.replace('{latitude}', location.latitude.toString()).replace('{longitude}', location.longitude.toString())
                      : csmStrings.N_A}
                  </Typography>
                </Grid>

                {/* Booking */}
                {booking && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.BOOKING}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {csmStrings.BOOKING_ID_FORMAT.replace('{id}', booking._id?.slice(-8) || '')}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.DRIVER}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {typeof booking.driver === 'object' ? booking.driver.fullName : ''}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.FROM}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {new Date(booking.from).toLocaleString()}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.TO}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {new Date(booking.to).toLocaleString()}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.PRICE_TOTAL}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {bookcarsHelper.formatPrice(booking.price || 0, commonStrings.CURRENCY, 'en')}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                      {csmStrings.PRICE_PER_DAY}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                      {(() => {
                        const ms = new Date(booking.to).getTime() - new Date(booking.from).getTime()
                        const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
                        const perDay = (booking.price || 0) / days
                        return bookcarsHelper.formatPrice(perDay, commonStrings.CURRENCY, 'en')
                      })()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Car State Report */}
      <CarStateReport
        car={car}
        booking={booking || undefined}
        location={location}
        onStateChange={handleStateChange}
        registerPdfHandler={registerPdfHandler}
      />
    </Box>
  )
}

export default CarStateManagement
