import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/car-states'
import CarState from './CarState'

interface CarStateListProps {
  carStates: bookcarsTypes.CarStateInfo[]
  onEdit?: (carState: bookcarsTypes.CarStateInfo) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

const CarStateList = ({ carStates, onEdit, onDelete, showActions = true }: CarStateListProps) => {
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

  if (carStates.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">{strings.EMPTY_LIST}</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{strings.STATE_TYPE}</TableCell>
            <TableCell>{strings.NOTES}</TableCell>
            <TableCell>{strings.ADMIN}</TableCell>
            <TableCell>{strings.CREATED_AT}</TableCell>
            {showActions && <TableCell>{strings.ACTIONS}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {carStates.map((carState) => (
            <TableRow key={carState._id}>
              <TableCell>
                <Chip
                  label={getStateLabel(carState.stateType)}
                  color={getStateColor(carState.stateType) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {carState.adminNotes || carState.customerNotes || carState.internalNotes ? (
                    <>
                      <Typography variant="body2" noWrap maxWidth={200}>
                        {carState.adminNotes || carState.customerNotes || carState.internalNotes}
                      </Typography>
                      <Tooltip title={carState.adminNotes || carState.customerNotes || carState.internalNotes}>
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {typeof carState.admin === 'string' ? carState.admin : carState.admin.fullName}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(carState.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {onEdit && (
                      <IconButton size="small" onClick={() => onEdit(carState)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton size="small" onClick={() => onDelete(carState._id!)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CarStateList
