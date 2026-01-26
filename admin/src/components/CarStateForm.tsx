import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Tooltip,
  Badge,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'

interface CarStateFormProps {
  open: boolean
  carState?: any
  cars: any[]
  locations: any[]
  bookings: any[]
  onClose: () => void
  onSuccess: () => void
}

interface DamageMarker {
  id: string
  type: string
  severity: string
  viewAngle: string
  x: number
  y: number
  description: string
  isNewDamage: boolean
}

interface IncludedItem {
  name: string
  isPresent: boolean
  condition: string
  notes?: string
}

interface CarStatePhoto {
  url: string
  caption: string
  viewAngle?: string
}

const schema = z.object({
  car: z.string().min(1, 'Car is required'),
  booking: z.string().optional(),
  stateType: z.enum([
    'PreRental',
    'PostRental',
    'Maintenance',
    'Damage',
    'Cleaning',
    'Inspection',
  ]),
  location: z.string().min(1, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  mileage: z.number().min(0, 'Mileage must be positive'),
  fuelLevel: z.number().min(0).max(100, 'Fuel level must be between 0-100%'),
  bodyCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  interiorCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  adminNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

const defaultIncludedItems = [
  'Spare Tire',
  'Jack',
  'Wheel Wrench',
  'First Aid Kit',
  'Fire Extinguisher',
  'Warning Triangle',
  'Owner Manual',
  'Registration Documents',
  'Insurance Documents',
  'Emergency Contact Numbers',
]

const CarStateForm: React.FC<CarStateFormProps> = ({
  open,
  carState,
  cars,
  locations,
  bookings,
  onClose,
  onSuccess,
}) => {
  const [damages, setDamages] = useState<DamageMarker[]>([])
  const [includedItems, setIncludedItems] = useState<IncludedItem[]>([])
  const [photos, setPhotos] = useState<CarStatePhoto[]>([])
  const [selectedViewAngle, setSelectedViewAngle] = useState<string>('front')
  const [damageCoordinates, setDamageCoordinates] = useState<{ x: number; y: number } | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      car: '',
      booking: '',
      stateType: 'PreRental',
      location: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      mileage: 0,
      fuelLevel: 100,
      bodyCondition: 'excellent',
      interiorCondition: 'excellent',
      adminNotes: '',
      customerNotes: '',
      internalNotes: '',
    },
  })

  const watchedStateType = watch('stateType')

  useEffect(() => {
    if (carState) {
      reset({
        car: carState.car._id || carState.car,
        booking: carState.booking?._id || carState.booking || '',
        stateType: carState.stateType,
        location: carState.location._id || carState.location,
        date: new Date(carState.date).toISOString().split('T')[0],
        time: carState.time,
        mileage: carState.mileage,
        fuelLevel: carState.fuelLevel,
        bodyCondition: carState.bodyCondition,
        interiorCondition: carState.interiorCondition,
        adminNotes: carState.adminNotes || '',
        customerNotes: carState.customerNotes || '',
        internalNotes: carState.internalNotes || '',
      })
      setDamages(carState.damages || [])
      setIncludedItems(carState.includedItems || [])
      setPhotos(carState.photos || [])
    } else {
      reset()
      setDamages([])
      setIncludedItems(defaultIncludedItems.map(item => ({
        name: item,
        isPresent: true,
        condition: 'good',
        notes: '',
      })))
      setPhotos([])
    }
  }, [carState, reset])

  const handleAddDamage = () => {
    if (damageCoordinates) {
      const newDamage: DamageMarker = {
        id: Date.now().toString(),
        type: 'W', // Default to dent
        severity: 'minor',
        viewAngle: selectedViewAngle,
        x: damageCoordinates.x,
        y: damageCoordinates.y,
        description: '',
        isNewDamage: true,
      }

      setDamages([...damages, newDamage])
      setDamageCoordinates(null)
    }
  }

  const handleRemoveDamage = (id: string) => {
    setDamages(damages.filter(d => d.id !== id))
  }

  const handleUpdateDamage = (id: string, field: keyof DamageMarker, value: any) => {
    setDamages(damages.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ))
  }

  const handleIncludedItemChange = (index: number, field: keyof IncludedItem, value: any) => {
    const newItems = [...includedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setIncludedItems(newItems)
  }

  const handleAddPhoto = () => {
    const newPhoto: CarStatePhoto = {
      url: '',
      caption: '',
      viewAngle: selectedViewAngle,
    }
    setPhotos([...photos, newPhoto])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleUpdatePhoto = (index: number, field: keyof CarStatePhoto, value: string) => {
    const newPhotos = [...photos]
    newPhotos[index] = { ...newPhotos[index], [field]: value }
    setPhotos(newPhotos)
  }

  const onSubmit = async (data: FormFields) => {
    try {
      const carStateData = {
        ...data,
        damages,
        includedItems,
        photos,
      }

      if (carState) {
        // Update existing car state
        // await CarStateService.update(carState._id, carStateData)
      } else {
        // Create new car state
        // await CarStateService.create(carStateData)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving car state:', error)
    }
  }

  const handleClose = () => {
    onClose()
    reset()
    setDamages([])
    setIncludedItems([])
    setPhotos([])
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {carState ? 'Edit Car State' : 'Create New Car State'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="car"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.car}>
                      <InputLabel>Car</InputLabel>
                      <Select {...field} label="Car">
                        {cars.map((car) => (
                          <MenuItem key={car._id} value={car._id}>
                            {car.name} ({car.supplier.fullName})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.car && (
                        <Typography color="error" variant="caption">
                          {errors.car.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="booking"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Booking (Optional)</InputLabel>
                      <Select {...field} label="Booking (Optional)">
                        <MenuItem value="">No Booking</MenuItem>
                        {bookings.map((booking) => (
                          <MenuItem key={booking._id} value={booking._id}>
                            {booking.pickupLocation.name} → {booking.dropOffLocation.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="stateType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.stateType}>
                      <InputLabel>State Type</InputLabel>
                      <Select {...field} label="State Type">
                        <MenuItem value="PreRental">Pre-Rental</MenuItem>
                        <MenuItem value="PostRental">Post-Rental</MenuItem>
                        <MenuItem value="Maintenance">Maintenance</MenuItem>
                        <MenuItem value="Damage">Damage Assessment</MenuItem>
                        <MenuItem value="Cleaning">Cleaning Required</MenuItem>
                        <MenuItem value="Inspection">General Inspection</MenuItem>
                      </Select>
                      {errors.stateType && (
                        <Typography color="error" variant="caption">
                          {errors.stateType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.location}>
                      <InputLabel>Location</InputLabel>
                      <Select {...field} label="Location">
                        {locations.map((location) => (
                          <MenuItem key={location._id} value={location._id}>
                            {location.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.location && (
                        <Typography color="error" variant="caption">
                          {errors.location.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Date"
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="time"
                      label="Time"
                      error={!!errors.time}
                      helperText={errors.time?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Vehicle Condition */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Vehicle Condition
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="mileage"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Mileage (km)"
                      error={!!errors.mileage}
                      helperText={errors.mileage?.message}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="fuelLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Fuel Level (%)"
                      error={!!errors.fuelLevel}
                      helperText={errors.fuelLevel?.message}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  )}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="bodyCondition"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.bodyCondition}>
                      <InputLabel>Body Condition</InputLabel>
                      <Select {...field} label="Body Condition">
                        <MenuItem value="excellent">Excellent</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="fair">Fair</MenuItem>
                        <MenuItem value="poor">Poor</MenuItem>
                      </Select>
                      {errors.bodyCondition && (
                        <Typography color="error" variant="caption">
                          {errors.bodyCondition.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="interiorCondition"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.interiorCondition}>
                      <InputLabel>Interior Condition</InputLabel>
                      <Select {...field} label="Interior Condition">
                        <MenuItem value="excellent">Excellent</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="fair">Fair</MenuItem>
                        <MenuItem value="poor">Poor</MenuItem>
                      </Select>
                      {errors.interiorCondition && (
                        <Typography color="error" variant="caption">
                          {errors.interiorCondition.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
            </Box>

            {/* Damage Tracking */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Damage Tracking
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>View Angle</InputLabel>
                  <Select
                    value={selectedViewAngle}
                    label="View Angle"
                    onChange={(e: SelectChangeEvent) => setSelectedViewAngle(e.target.value)}
                  >
                    <MenuItem value="front">Front</MenuItem>
                    <MenuItem value="back">Back</MenuItem>
                    <MenuItem value="left">Left Side</MenuItem>
                    <MenuItem value="right">Right Side</MenuItem>
                    <MenuItem value="top">Top</MenuItem>
                    <MenuItem value="interior">Interior</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDamage}
                  disabled={!damageCoordinates}
                >
                  Add Damage at Selected Position
                </Button>
              </Box>
            </Box>

            {/* Damage List */}
            <Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Damages ({damages.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {damages.length === 0 ? (
                    <Typography color="textSecondary">
                      No damages recorded
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {damages.map((damage) => (
                        <Box key={damage.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                      value={damage.type}
                                      label="Type"
                                      onChange={(e) => handleUpdateDamage(damage.id, 'type', e.target.value)}
                                    >
                                      <MenuItem value="W">W - Dent</MenuItem>
                                      <MenuItem value="P">P - Crack</MenuItem>
                                      <MenuItem value="O">O - Chip</MenuItem>
                                      <MenuItem value="T">T - Scratch</MenuItem>
                                      <MenuItem value="R">R - Scuff</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Severity</InputLabel>
                                    <Select
                                      value={damage.severity}
                                      label="Severity"
                                      onChange={(e) => handleUpdateDamage(damage.id, 'severity', e.target.value)}
                                    >
                                      <MenuItem value="minor">Minor</MenuItem>
                                      <MenuItem value="moderate">Moderate</MenuItem>
                                      <MenuItem value="major">Major</MenuItem>
                                      <MenuItem value="critical">Critical</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    {damage.viewAngle}
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Description"
                                    value={damage.description}
                                    onChange={(e) => handleUpdateDamage(damage.id, 'description', e.target.value)}
                                  />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={damage.isNewDamage}
                                        onChange={(e) => handleUpdateDamage(damage.id, 'isNewDamage', e.target.checked)}
                                      />
                                    }
                                    label="New Damage"
                                  />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveDamage(damage.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* Included Items */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Included Items Checklist
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {includedItems.map((item, itemIndex) => (
                <Box key={itemIndex} sx={{ flex: 1, minWidth: 200 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={item.isPresent}
                                  onChange={(e) => handleIncludedItemChange(itemIndex, 'isPresent', e.target.checked)}
                                />
                              }
                              label="Present"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Condition</InputLabel>
                              <Select
                                value={item.condition}
                                label="Condition"
                                onChange={(e) => handleIncludedItemChange(itemIndex, 'condition', e.target.value)}
                              >
                                <MenuItem value="excellent">Excellent</MenuItem>
                                <MenuItem value="good">Good</MenuItem>
                                <MenuItem value="fair">Fair</MenuItem>
                                <MenuItem value="poor">Poor</MenuItem>
                                <MenuItem value="missing">Missing</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                        <Box>
                          <TextField
                            fullWidth
                            size="small"
                            label="Notes"
                            value={item.notes || ''}
                                                          onChange={(e) => handleIncludedItemChange(itemIndex, 'notes', e.target.value)}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            {/* Photos */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Photos & Documentation
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoIcon />}
                  onClick={handleAddPhoto}
                >
                  Add Photo
                </Button>
              </Box>

              <Box sx={{ flex: 1 }}>
                {photos.length === 0 ? (
                  <Typography color="textSecondary">
                    No photos uploaded
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {photos.map((photo, index) => (
                      <Box key={index} sx={{ flex: 1, minWidth: 200 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Photo URL"
                                  value={photo.url}
                                  onChange={(e) => handleUpdatePhoto(index, 'url', e.target.value)}
                                />
                              </Box>
                              <Box>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Caption"
                                  value={photo.caption}
                                  onChange={(e) => handleUpdatePhoto(index, 'caption', e.target.value)}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ flex: 1 }}>
                                  <FormControl size="small" fullWidth>
                                    <InputLabel>View Angle</InputLabel>
                                    <Select
                                      value={photo.viewAngle || ''}
                                      label="View Angle"
                                      onChange={(e) => handleUpdatePhoto(index, 'viewAngle', e.target.value)}
                                    >
                                      <MenuItem value="">Any</MenuItem>
                                      <MenuItem value="front">Front</MenuItem>
                                      <MenuItem value="back">Back</MenuItem>
                                      <MenuItem value="left">Left Side</MenuItem>
                                      <MenuItem value="right">Right Side</MenuItem>
                                      <MenuItem value="top">Top</MenuItem>
                                      <MenuItem value="interior">Interior</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Button
                                    fullWidth
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleRemovePhoto(index)}
                                  >
                                    Remove Photo
                                  </Button>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Notes */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notes & Comments
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="adminNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Admin Notes"
                      placeholder="Internal notes for staff..."
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="customerNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Customer Notes"
                      placeholder="Notes visible to customer..."
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="internalNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Internal Notes"
                      placeholder="Confidential internal notes..."
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {carState ? 'Update' : 'Create'} Car State
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CarStateForm
