import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Box, Typography, Chip, CircularProgress, Alert } from '@mui/material'
import { DirectionsCar as CarIcon, Speed as SpeedIcon, LocationOn as LocationIcon } from '@mui/icons-material'
import * as GPSService from '../services/GPSService'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom car icon
const createCarIcon = (status: string) => {
  const color = status === 'online' ? '#4caf50' : '#f44336'
  
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

interface VehicleData {
  device: GPSService.GPSDevice
  position: GPSService.GPSPosition
}

// Component to auto-fit map bounds
const AutoFitBounds: React.FC<{ positions: GPSService.GPSPosition[] }> = ({ positions }) => {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(
        positions.map((pos) => [pos.latitude, pos.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [positions, map])

  return null
}

interface GPSMapProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

const GPSMap: React.FC<GPSMapProps> = ({ autoRefresh = true, refreshInterval = 30000 }) => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadGPSData = async () => {
    try {
      setError(null)
      
      // Fetch devices and positions in parallel
      const [devices, positions] = await Promise.all([
        GPSService.getDevices(),
        GPSService.getPositions(undefined, true),
      ])

      // Match devices with their positions
      const vehicleData: VehicleData[] = devices
        .map((device) => {
          const position = positions.find((pos) => pos.deviceId === device.id)
          return position ? { device, position } : null
        })
        .filter((v): v is VehicleData => v !== null)

      setVehicles(vehicleData)
      setLoading(false)
    } catch (err: any) {
      console.error('[GPSMap] Error loading GPS data:', err)
      setError(err.response?.data?.error || 'Failed to load GPS data')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGPSData()

    // Setup auto-refresh
    if (autoRefresh) {
      intervalRef.current = setInterval(loadGPSData, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])

  const formatSpeed = (speed: number) => {
    // Convert from knots to km/h
    const kmh = Math.round(speed * 1.852)
    return `${kmh} km/h`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (vehicles.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">No GPS-tracked vehicles found</Alert>
      </Box>
    )
  }

  // Default center (will be overridden by AutoFitBounds)
  const defaultCenter: [number, number] = [vehicles[0].position.latitude, vehicles[0].position.longitude]

  return (
    <Box sx={{ height: 500, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <AutoFitBounds positions={vehicles.map((v) => v.position)} />

        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.device.id}
            position={[vehicle.position.latitude, vehicle.position.longitude]}
            icon={createCarIcon(vehicle.device.status)}
          >
            <Popup>
              <Box sx={{ minWidth: 220 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CarIcon sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {vehicle.device.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
                  <Chip
                    label={vehicle.device.status}
                    size="small"
                    color={vehicle.device.status === 'online' ? 'success' : 'error'}
                  />
                  {vehicle.position.valid && (
                    <Chip label="GPS Valid" size="small" color="success" variant="outlined" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {vehicle.position.speed > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant="body2">
                        {formatSpeed(vehicle.position.speed)}
                      </Typography>
                    </Box>
                  )}

                  {vehicle.position.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 18, color: '#666', mt: 0.2 }} />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {vehicle.position.address}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Last update: {formatDate(vehicle.position.fixTime)}
                  </Typography>

                  {vehicle.device.model && (
                    <Typography variant="caption" color="text.secondary">
                      Model: {vehicle.device.model}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  )
}

export default GPSMap
