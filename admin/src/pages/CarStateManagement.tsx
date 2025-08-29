import React, { useState, useEffect } from 'react'
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
  const [pdfGenerator, setPdfGenerator] = useState<(() => void) | null>(null)
  const pdfHandlerRef = React.useRef<(fn: () => void) => void>();

  // Memoize the handler registration function
  const registerPdfHandler = React.useCallback((fn: () => void) => {
    setPdfGenerator(() => fn);
  }, []);
  useEffect(() => {
    loadData()
  }, [carId, bookingId])

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
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStateChange = () => {
    // Refresh data when car state changes
    loadData()
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
          Go Back
        </Button>
      </Box>
    )
  }

  if (!car || !location) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Car or location information not found.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
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
            onClick={() => pdfGenerator && pdfGenerator()}
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
          {car.immatriculation || 'N/A'}
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

        {/* Uncomment if mileage is needed */}
        {/* 
        <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
          {csmStrings.MILEAGE}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
          {car.mileage} km
        </Typography>
        */}
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
                ? `${location.latitude}, ${location.longitude}`
                : 'N/A'}
            </Typography>
          </Grid>

          {/* Booking */}
          {booking && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                {csmStrings.BOOKING}
              </Typography>
              <Typography variant="body1" sx={{ mt: 0, mb: 1 }}>
                {booking._id?.slice(-8)}...
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
                  const ms = new Date(booking.to).getTime() - new Date(booking.from).getTime();
                  const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
                  const perDay = (booking.price || 0) / days;
                  return bookcarsHelper.formatPrice(perDay, commonStrings.CURRENCY, 'en');
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
