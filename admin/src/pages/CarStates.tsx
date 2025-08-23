import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

const CarStates = () => {
  const [loading, setLoading] = useState(false)

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Car States Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add Car State
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Car State Management System
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            The car state management system is currently being set up. This feature allows you to:
          </Alert>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li">Track car conditions before and after rentals</Typography>
            <Typography component="li">Document damages with visual mapping</Typography>
            <Typography component="li">Compare before/after states</Typography>
            <Typography component="li">Manage included items and photos</Typography>
            <Typography component="li">Generate detailed reports</Typography>
          </Box>
          <Alert severity="success" sx={{ mt: 2 }}>
            Backend API is ready and working. Frontend components are being configured.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CarStates
