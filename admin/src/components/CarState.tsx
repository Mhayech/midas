import React from 'react'
import {
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/car-states'
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

interface CarStateProps {
  carState: bookcarsTypes.CarStateInfo
  onEdit?: (carState: bookcarsTypes.CarStateInfo) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

const CarState = ({ carState, onEdit, onDelete, showActions = true }: CarStateProps) => {
  const [openEditDialog, setOpenEditDialog] = React.useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      state: carState.stateType,
              notes: carState.adminNotes || '',
    },
  })

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

  const handleEdit = () => {
    setOpenEditDialog(true)
  }

  const handleDelete = () => {
    setOpenDeleteDialog(true)
  }

  const handleEditSubmit = async (data: FormFields) => {
    if (onEdit) {
      await onEdit({
        ...carState,
        ...data,
      })
      setOpenEditDialog(false)
      reset()
    }
  }

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(carState._id!)
      setOpenDeleteDialog(false)
    }
  }

  const handleCloseEdit = () => {
    setOpenEditDialog(false)
    reset()
  }

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
                  label={getStateLabel(carState.stateType)}
        color={getStateColor(carState.stateType) as any}
          size="small"
        />
        {(carState.adminNotes || carState.customerNotes || carState.internalNotes) && (
          <Tooltip title={carState.adminNotes || carState.customerNotes || carState.internalNotes}>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {showActions && (
          <Box display="flex" gap={0.5}>
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>{strings.UPDATE_CAR_STATE}</DialogTitle>
        <form onSubmit={handleSubmit(handleEditSubmit)}>
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
            <Button onClick={handleCloseEdit}>{commonStrings.CANCEL}</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {commonStrings.SAVE}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>{commonStrings.CONFIRM_TITLE}</DialogTitle>
        <DialogContent>
          <Typography>{strings.DELETE_CAR_STATE}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            {commonStrings.CANCEL}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {commonStrings.DELETE}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CarState
