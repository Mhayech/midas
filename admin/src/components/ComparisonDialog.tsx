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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material'
import {
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import * as CarStateService from '../services/CarStateService'
import { strings } from '../lang/car-states'

interface ComparisonDialogProps {
  open: boolean
  bookingId: string
  onClose: () => void
}

const ComparisonDialog = ({ open, bookingId, onClose }: ComparisonDialogProps) => {
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && bookingId) {
      _loadComparison()
    }
  }, [open, bookingId])

  const _loadComparison = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await CarStateService.compareStates(bookingId)
      setComparison(response)
    } catch (err) {
      console.error(err)
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return timeString.substring(0, 5)
    } catch {
      return timeString
    }
  }

  if (!comparison) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {strings.COMPARE} - {loading ? 'Loading...' : 'No Data'}
            </Typography>
            <IconButton onClick={onClose}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Loading comparison data...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const { preRental, postRental, differences } = comparison

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {strings.COMPARE} - Booking {bookingId}
          </Typography>
          <IconButton onClick={onClose}>
            <CancelIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Mileage Difference
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h4" color="primary.main">
                  +{differences?.mileage || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Fuel Level Change
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingDownIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h4" color="warning.main">
                  {differences?.fuelLevel || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                New Damages
              </Typography>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h4" color="error.main">
                  {differences?.newDamages?.length || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Total Damages
              </Typography>
              <Box display="flex" alignItems="center">
                <Badge badgeContent={postRental?.damages?.length || 0} color="error">
                  <WarningIcon />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Comparison Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Pre-Rental State */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {strings.BEFORE_RENTAL}
              </Typography>
              {preRental ? (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Date: {formatDate(preRental.date)} at {formatTime(preRental.time)}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    <Typography variant="body2">
                      Mileage: {preRental.mileage?.toLocaleString()} km
                    </Typography>
                    <Typography variant="body2">
                      Fuel: {preRental.fuelLevel}%
                    </Typography>
                    <Typography variant="body2">
                      Body: {preRental.bodyCondition}
                    </Typography>
                    <Typography variant="body2">
                      Interior: {preRental.interiorCondition}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No pre-rental state found
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Post-Rental State */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {strings.AFTER_RENTAL}
              </Typography>
              {postRental ? (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Date: {formatDate(postRental.date)} at {formatTime(postRental.time)}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    <Typography variant="body2">
                      Mileage: {postRental.mileage?.toLocaleString()} km
                    </Typography>
                    <Typography variant="body2">
                      Fuel: {postRental.fuelLevel}%
                    </Typography>
                    <Typography variant="body2">
                      Body: {postRental.bodyCondition}
                    </Typography>
                    <Typography variant="body2">
                      Interior: {postRental.interiorCondition}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No post-rental state found
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Damages Comparison */}
          {differences?.newDamages && differences.newDamages.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.NEW_DAMAGES}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {differences.newDamages.map((damage: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip label={damage.type} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={damage.severity} 
                              size="small"
                              color={damage.severity === 'major' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{damage.viewAngle}</TableCell>
                          <TableCell>{damage.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ComparisonDialog

