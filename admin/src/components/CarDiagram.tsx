import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Chip,
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
  SelectChangeEvent,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'

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

interface CarDiagramProps {
  damages: DamageMarker[]
  viewAngle: string
  onDamageClick?: (x: number, y: number) => void
  onDamageEdit?: (damage: DamageMarker) => void
  onDamageDelete?: (id: string) => void
  readOnly?: boolean
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`car-diagram-tabpanel-${index}`}
      aria-labelledby={`car-diagram-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const CarDiagram: React.FC<CarDiagramProps> = ({
  damages,
  viewAngle,
  onDamageClick,
  onDamageEdit,
  onDamageDelete,
  readOnly = false,
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedDamage, setSelectedDamage] = useState<DamageMarker | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDamage, setEditDamage] = useState<Partial<DamageMarker>>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const viewAngles = [
    { value: 'front', label: 'Front View' },
    { value: 'back', label: 'Back View' },
    { value: 'left', label: 'Left Side' },
    { value: 'right', label: 'Right Side' },
    { value: 'top', label: 'Top View' },
    { value: 'interior', label: 'Interior' },
  ]

  const damageTypes = [
    { value: 'W', label: 'Dent (W)' },
    { value: 'P', label: 'Crack (P)' },
    { value: 'O', label: 'Chip (O)' },
    { value: 'T', label: 'Scratch (T)' },
    { value: 'R', label: 'Scuff (R)' },
  ]

  const severityLevels = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'major', label: 'Major' },
    { value: 'critical', label: 'Critical' },
  ]

  useEffect(() => {
    drawCarDiagram()
  }, [damages, viewAngle, tabValue])

  const drawCarDiagram = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw car outline based on view angle
    drawCarOutline(ctx, canvas.width, canvas.height)

    // Draw damage markers
    const currentViewDamages = damages.filter(d => d.viewAngle === viewAngles[tabValue].value)
    currentViewDamages.forEach(damage => {
      drawDamageMarker(ctx, damage)
    })
  }

  const drawCarOutline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.fillStyle = '#f5f5f5'

    const viewAngle = viewAngles[tabValue].value

    switch (viewAngle) {
      case 'front':
        // Front view - car front
        ctx.beginPath()
        ctx.roundRect(width * 0.2, height * 0.1, width * 0.6, height * 0.8, 10)
        ctx.fill()
        ctx.stroke()
        
        // Headlights
        ctx.fillStyle = '#fff'
        ctx.fillRect(width * 0.25, height * 0.15, width * 0.1, height * 0.1)
        ctx.fillRect(width * 0.65, height * 0.15, width * 0.1, height * 0.1)
        break

      case 'back':
        // Back view - car rear
        ctx.beginPath()
        ctx.roundRect(width * 0.2, height * 0.1, width * 0.6, height * 0.8, 10)
        ctx.fill()
        ctx.stroke()
        
        // Taillights
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(width * 0.25, height * 0.15, width * 0.1, height * 0.1)
        ctx.fillRect(width * 0.65, height * 0.15, width * 0.1, height * 0.1)
        break

      case 'left':
      case 'right':
        // Side view
        ctx.beginPath()
        ctx.roundRect(width * 0.1, height * 0.2, width * 0.8, height * 0.6, 10)
        ctx.fill()
        ctx.stroke()
        
        // Windows
        ctx.fillStyle = '#87ceeb'
        ctx.fillRect(width * 0.3, height * 0.25, width * 0.4, height * 0.2)
        break

      case 'top':
        // Top view - car from above
        ctx.beginPath()
        ctx.roundRect(width * 0.15, height * 0.2, width * 0.7, height * 0.6, 10)
        ctx.fill()
        ctx.stroke()
        
        // Roof
        ctx.fillStyle = '#ddd'
        ctx.fillRect(width * 0.25, height * 0.25, width * 0.5, height * 0.3)
        break

      case 'interior':
        // Interior view - seats and dashboard
        ctx.beginPath()
        ctx.roundRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8, 10)
        ctx.fill()
        ctx.stroke()
        
        // Dashboard
        ctx.fillStyle = '#333'
        ctx.fillRect(width * 0.15, height * 0.15, width * 0.7, height * 0.15)
        
        // Seats
        ctx.fillStyle = '#666'
        ctx.fillRect(width * 0.2, height * 0.4, width * 0.25, height * 0.4)
        ctx.fillRect(width * 0.55, height * 0.4, width * 0.25, height * 0.4)
        break
    }
  }

  const drawDamageMarker = (ctx: CanvasRenderingContext2D, damage: DamageMarker) => {
    const color = damage.isNewDamage ? '#ff0000' : '#0066cc'
    const size = damage.severity === 'critical' ? 12 : damage.severity === 'major' ? 10 : damage.severity === 'moderate' ? 8 : 6

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(damage.x, damage.y, size, 0, 2 * Math.PI)
    ctx.fill()

    // Draw border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw damage type label
    ctx.fillStyle = '#000'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(damage.type, damage.x, damage.y + size + 15)
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check if clicking on existing damage
    const currentViewDamages = damages.filter(d => d.viewAngle === viewAngles[tabValue].value)
    const clickedDamage = currentViewDamages.find(damage => {
      const distance = Math.sqrt((damage.x - x) ** 2 + (damage.y - y) ** 2)
      return distance <= 15
    })

    if (clickedDamage) {
      setSelectedDamage(clickedDamage)
    } else if (onDamageClick) {
      onDamageClick(x, y)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditDamage = (damage: DamageMarker) => {
    setEditDamage(damage)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (onDamageEdit && selectedDamage) {
      onDamageEdit({ ...selectedDamage, ...editDamage })
    }
    setEditDialogOpen(false)
    setEditDamage({})
  }

  const handleDeleteDamage = (id: string) => {
    if (onDamageDelete) {
      onDamageDelete(id)
    }
    setSelectedDamage(null)
  }

  const getDamageTypeLabel = (type: string) => {
    const damageType = damageTypes.find(dt => dt.value === type)
    return damageType ? damageType.label : type
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'major':
        return 'warning'
      case 'moderate':
        return 'info'
      case 'minor':
        return 'success'
      default:
        return 'default'
    }
  }

  const currentViewDamages = damages.filter(d => d.viewAngle === viewAngles[tabValue].value)

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Car Diagram - Damage Mapping
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="car view angles">
            {viewAngles.map((angle) => (
              <Tab key={angle.value} label={angle.label} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                style={{ 
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: readOnly ? 'default' : 'crosshair'
                }}
                onClick={handleCanvasClick}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Legend:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="New Damages (Red)"
                  size="small"
                  sx={{ bgcolor: '#ff0000', color: 'white' }}
                />
                <Chip
                  label="Previous Damages (Blue)"
                  size="small"
                  sx={{ bgcolor: '#0066cc', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Damages - {viewAngles[tabValue].label}
            </Typography>
            
            {currentViewDamages.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No damages recorded for this view
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {currentViewDamages.map((damage) => (
                  <Box
                    key={damage.id}
                    sx={{
                      p: 1,
                      mb: 1,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      bgcolor: selectedDamage?.id === damage.id ? '#f5f5f5' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {getDamageTypeLabel(damage.type)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Position: ({damage.x}, {damage.y})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={damage.severity}
                          color={getSeverityColor(damage.severity)}
                          size="small"
                        />
                        <Chip
                          label={damage.isNewDamage ? 'New' : 'Previous'}
                          color={damage.isNewDamage ? 'error' : 'info'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    {damage.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {damage.description}
                      </Typography>
                    )}

                    {!readOnly && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        <Tooltip title="Edit Damage">
                          <IconButton
                            size="small"
                            onClick={() => handleEditDamage(damage)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Damage">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDamage(damage.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Edit Damage Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Damage</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Damage Type</InputLabel>
                <Select
                  value={editDamage.type || ''}
                  onChange={(e: SelectChangeEvent) => setEditDamage({ ...editDamage, type: e.target.value })}
                  label="Damage Type"
                >
                  {damageTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={editDamage.severity || ''}
                  onChange={(e: SelectChangeEvent) => setEditDamage({ ...editDamage, severity: e.target.value })}
                  label="Severity"
                >
                  {severityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editDamage.description || ''}
                onChange={(e) => setEditDamage({ ...editDamage, description: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default CarDiagram

