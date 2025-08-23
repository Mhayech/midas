import React from 'react'
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
  Typography,
  Alert,
} from '@mui/material'
import { Cancel as CancelIcon } from '@mui/icons-material'

interface CarStateViewProps {
  open: boolean
  carState: any
  onClose: () => void
}

const CarStateView = ({ open, carState, onClose }: CarStateViewProps) => {
  if (!carState) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            View Car State
          </Typography>
          <IconButton onClick={onClose}>
            <CancelIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Car:</strong> {carState.car?.name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>State Type:</strong> {carState.stateType || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {carState.location?.name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {carState.date || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {carState.time || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicle Condition
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Mileage:</strong> {carState.mileage?.toLocaleString() || 'N/A'} km
                </Typography>
                <Typography variant="body2">
                  <strong>Fuel Level:</strong> {carState.fuelLevel || 'N/A'}%
                </Typography>
                <Typography variant="body2">
                  <strong>Body Condition:</strong> {carState.bodyCondition || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Interior Condition:</strong> {carState.interiorCondition || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Damages
              </Typography>
              {carState.damages && carState.damages.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {carState.damages.map((damage: any, index: number) => (
                    <Box key={index} sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Type:</strong> {damage.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Severity:</strong> {damage.severity}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {damage.viewAngle}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Description:</strong> {damage.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No damages recorded</Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {carState.adminNotes && (
                  <Typography variant="body2">
                    <strong>Admin Notes:</strong> {carState.adminNotes}
                  </Typography>
                )}
                {carState.customerNotes && (
                  <Typography variant="body2">
                    <strong>Customer Notes:</strong> {carState.customerNotes}
                  </Typography>
                )}
                {carState.internalNotes && (
                  <Typography variant="body2">
                    <strong>Internal Notes:</strong> {carState.internalNotes}
                  </Typography>
                )}
                {!carState.adminNotes && !carState.customerNotes && !carState.internalNotes && (
                  <Alert severity="info">No notes available</Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CarStateView

