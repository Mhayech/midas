import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/car-states'
import * as CarStateService from '@/services/CarStateService'
import * as UserService from '@/services/UserService'
import CarStateList from './CarStateList'
import * as helper from '@/utils/helper'

const schema = z.object({
  state: z.enum([
    bookcarsTypes.CarState.Available,
    bookcarsTypes.CarState.InUse,
    bookcarsTypes.CarState.Maintenance,
    bookcarsTypes.CarState.Damaged,
    bookcarsTypes.CarState.Cleaning,
    bookcarsTypes.CarState.OutOfService,
    bookcarsTypes.CarState.PreRental,
    bookcarsTypes.CarState.PostRental,
  ]),
  notes: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

interface CarStateManagerProps {
  car: bookcarsTypes.Car
  onStateChange?: () => void
}

const CarStateManager = ({ car, onStateChange }: CarStateManagerProps) => {
  const [carStates, setCarStates] = useState<bookcarsTypes.CarStateInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [openEditForm, setOpenEditForm] = useState(false)
  const [editingCarState, setEditingCarState] = useState<bookcarsTypes.CarStateInfo | null>(null)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      state: bookcarsTypes.CarState.Available,
      notes: '',
    },
  })

  useEffect(() => {
    loadCarStates()
  }, [car._id])

  const loadCarStates = async () => {
    try {
      setLoading(true)
      const states = await CarStateService.getCarStatesByCar(car._id)
      setCarStates(states)
    } catch (error) {
      console.error('Error loading car states:', error)
      showSnackbar('Error loading car states', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStateColor = (state: bookcarsTypes.CarState) => {
    switch (state) {
      case bookcarsTypes.CarState.Available:
        return 'success'
      case bookcarsTypes.CarState.InUse:
        return 'primary'
      case bookcarsTypes.CarState.Maintenance:
        return 'warning'
      case bookcarsTypes.CarState.Damaged:
        return 'error'
      case bookcarsTypes.CarState.Cleaning:
        return 'info'
      case bookcarsTypes.CarState.OutOfService:
        return 'default'
      case bookcarsTypes.CarState.PreRental:
        return 'secondary'
      case bookcarsTypes.CarState.PostRental:
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStateLabel = (state: bookcarsTypes.CarState) => {
    switch (state) {
      case bookcarsTypes.CarState.Available:
        return 'Available'
      case bookcarsTypes.CarState.InUse:
        return 'In Use'
      case bookcarsTypes.CarState.Maintenance:
        return 'Maintenance'
      case bookcarsTypes.CarState.Damaged:
        return 'Damaged'
      case bookcarsTypes.CarState.Cleaning:
        return 'Cleaning'
      case bookcarsTypes.CarState.OutOfService:
        return 'Out of Service'
      case bookcarsTypes.CarState.PreRental:
        return 'Pre-Rental'
      case bookcarsTypes.CarState.PostRental:
        return 'Post-Rental'
      default:
        return state
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateState = async (data: FormFields) => {
    try {
      const currentUser = UserService.getCurrentUser()
      if (!currentUser?._id) {
        console.error('No authenticated user found')
        showSnackbar('Authentication error: No user found', 'error')
        return
      }

      await CarStateService.create({
        car: car._id,
        stateType: data.state,
        adminNotes: data.notes,
        location: typeof car.locations[0] === 'string' ? car.locations[0] : car.locations[0]?._id || '',
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        mileage: 0,
        fuelLevel: 50,
        bodyCondition: 'excellent',
        interiorCondition: 'excellent',
        admin: currentUser._id, // Use actual authenticated user ID
      } as bookcarsTypes.CreateCarStatePayload)
      
      showSnackbar(strings.CAR_STATE_CREATED, 'success')
      setOpenForm(false)
      reset()
      loadCarStates()
      if (onStateChange) onStateChange()
    } catch (error) {
      console.error('Error creating car state:', error)
      showSnackbar(strings.ERROR_CREATING_CAR_STATE, 'error')
    }
  }

  const handleEditState = async (carState: bookcarsTypes.CarStateInfo) => {
    setEditingCarState(carState)
    setOpenEditForm(true)
  }

  const handleUpdateState = async (data: FormFields) => {
    if (!editingCarState) return

    try {
      await CarStateService.update({
        _id: editingCarState._id!,
        stateType: data.state,
        adminNotes: data.notes,
      })
      
      showSnackbar(strings.CAR_STATE_UPDATED, 'success')
      setOpenEditForm(false)
      setEditingCarState(null)
      reset()
      loadCarStates()
      if (onStateChange) onStateChange()
    } catch (error) {
      console.error('Error updating car state:', error)
      showSnackbar(strings.ERROR_UPDATING_CAR_STATE, 'error')
    }
  }

  const handleDeleteState = async (id: string) => {
    try {
      await CarStateService.deleteCarState(id)
      
      showSnackbar(strings.CAR_STATE_DELETED, 'success')
      loadCarStates()
      if (onStateChange) onStateChange()
    } catch (error) {
      console.error('Error deleting car state:', error)
      showSnackbar(strings.ERROR_DELETING_CAR_STATE, 'error')
    }
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    reset()
  }

  const handleCloseEditForm = () => {
    setOpenEditForm(false)
    setEditingCarState(null)
    reset()
  }

  return (
    <Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">{strings.CAR_STATES}</Typography>
            <Chip
              label={getStateLabel(car.currentState || bookcarsTypes.CarState.Available)}
              color={getStateColor(car.currentState || bookcarsTypes.CarState.Available) as any}
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">{strings.STATE_HISTORY}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
            >
              {strings.NEW_CAR_STATE}
            </Button>
          </Box>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <CarStateList
              carStates={carStates}
              onEdit={handleEditState}
              onDelete={handleDeleteState}
            />
          )}
        </AccordionDetails>
      </Accordion>

      {/* Create Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{strings.NEW_CAR_STATE}</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateState)}>
          <DialogContent>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{strings.STATE_TYPE}</InputLabel>
                  <Select {...field} label={strings.STATE_TYPE}>
                    <MenuItem value={bookcarsTypes.CarState.Available}>
                      {getStateLabel(bookcarsTypes.CarState.Available)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.InUse}>
                      {getStateLabel(bookcarsTypes.CarState.InUse)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Maintenance}>
                      {getStateLabel(bookcarsTypes.CarState.Maintenance)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Damaged}>
                      {getStateLabel(bookcarsTypes.CarState.Damaged)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Cleaning}>
                      {getStateLabel(bookcarsTypes.CarState.Cleaning)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.OutOfService}>
                      {getStateLabel(bookcarsTypes.CarState.OutOfService)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.PreRental}>
                      {getStateLabel(bookcarsTypes.CarState.PreRental)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.PostRental}>
                      {getStateLabel(bookcarsTypes.CarState.PostRental)}
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            {errors.state && (
              <Typography color="error" variant="caption">
                {errors.state.message}
              </Typography>
            )}

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="normal"
                  label={strings.NOTES}
                  multiline
                  rows={3}
                  placeholder={strings.NOTES_PLACEHOLDER}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>{commonStrings.CANCEL}</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {commonStrings.CREATE}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={openEditForm} onClose={handleCloseEditForm} maxWidth="sm" fullWidth>
        <DialogTitle>{strings.UPDATE_CAR_STATE}</DialogTitle>
        <form onSubmit={handleSubmit(handleUpdateState)}>
          <DialogContent>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{strings.STATE_TYPE}</InputLabel>
                  <Select {...field} label={strings.STATE_TYPE}>
                    <MenuItem value={bookcarsTypes.CarState.Available}>
                      {getStateLabel(bookcarsTypes.CarState.Available)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.InUse}>
                      {getStateLabel(bookcarsTypes.CarState.InUse)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Maintenance}>
                      {getStateLabel(bookcarsTypes.CarState.Maintenance)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Damaged}>
                      {getStateLabel(bookcarsTypes.CarState.Damaged)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.Cleaning}>
                      {getStateLabel(bookcarsTypes.CarState.Cleaning)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.OutOfService}>
                      {getStateLabel(bookcarsTypes.CarState.OutOfService)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.PreRental}>
                      {getStateLabel(bookcarsTypes.CarState.PreRental)}
                    </MenuItem>
                    <MenuItem value={bookcarsTypes.CarState.PostRental}>
                      {getStateLabel(bookcarsTypes.CarState.PostRental)}
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            {errors.state && (
              <Typography color="error" variant="caption">
                {errors.state.message}
              </Typography>
            )}

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="normal"
                  label={strings.NOTES}
                  multiline
                  rows={3}
                  placeholder={strings.NOTES_PLACEHOLDER}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditForm}>{commonStrings.CANCEL}</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {commonStrings.SAVE}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CarStateManager
