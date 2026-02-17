import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent,
  IconButton,
  Tooltip as MuiTooltip,
  Chip,
  Fade,
  Paper,
  Alert,
  Skeleton,
  TablePagination,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Download as DownloadIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Description as ContractIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MoneyIcon,
  Timer as TimerIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as FinancialReportService from '@/services/FinancialReportService'
import * as SupplierService from '@/services/SupplierService'
import * as ContractService from '@/services/ContractService'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/financial-reports'

import '@/assets/css/financial-reports.css'
import '@/assets/css/enhanced-theme.css'

// Types for contract/booking data
interface ContractInfo {
  bookingId: string
  contractNumber: string
  fileName?: string
}

interface BookingDetail {
  bookingId: string
  contractNumber?: string
  carName: string
  from: string
  to: string
  price: number
  status: string
}

interface ContractsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  contracts: ContractInfo[]
  onDownload: (bookingId: string) => void
}

// Contracts Dialog Component - Scalable view for many contracts
const ContractsDialog: React.FC<ContractsDialogProps> = ({ open, onClose, title, contracts, onDownload }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 3 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#2F5233',
        color: 'white',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip 
            label={`${contracts.length} ${strings.CONTRACTS}`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', ml: 1 }}
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {contracts.map((contract, idx) => (
            <React.Fragment key={contract.bookingId}>
              <ListItem 
                sx={{ 
                  py: 2,
                  '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.04)' },
                  cursor: 'pointer'
                }}
                onClick={() => onDownload(contract.bookingId)}
              >
                <ListItemIcon>
                  <ContractIcon sx={{ color: '#2F5233' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography sx={{ fontWeight: 600 }}>
                      {contract.contractNumber || `Contract #${idx + 1}`}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {strings.CLICK_TO_DOWNLOAD}
                    </Typography>
                  }
                />
                <IconButton 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(47, 82, 51, 0.1)',
                    '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.2)' }
                  }}
                >
                  <DownloadIcon fontSize="small" sx={{ color: '#2F5233' }} />
                </IconButton>
              </ListItem>
              {idx < contracts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {strings.CLOSE}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Expandable Row Component for Car Earnings
interface ExpandableCarRowProps {
  car: any
  formatCurrency: (amount: number) => string
  onDownloadContract: (bookingId: string) => void
}

const ExpandableCarRow: React.FC<ExpandableCarRowProps> = ({ car, formatCurrency, onDownloadContract }) => {
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasContracts = car.contracts && car.contracts.length > 0
  const contractCount = hasContracts ? car.contracts.length : 0
  
  return (
    <>
      <TableRow 
        hover 
        sx={{ 
          '& > *': { borderBottom: expanded ? 'none' : undefined },
          bgcolor: expanded ? 'rgba(47, 82, 51, 0.02)' : undefined,
          cursor: hasContracts ? 'pointer' : 'default'
        }}
        onClick={() => hasContracts && setExpanded(!expanded)}
      >
        <TableCell>
          {hasContracts && (
            <IconButton size="small" sx={{ mr: 1 }}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          )}
          {car.carName}
        </TableCell>
        <TableCell sx={{ color: '#666' }}>{car.carMake}</TableCell>
        <TableCell sx={{ color: '#666' }}>{car.immatriculation}</TableCell>
        <TableCell align="center">{car.rentalCount}</TableCell>
        <TableCell align="center">{car.totalDaysRented}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>
          {formatCurrency(car.totalEarnings)}
        </TableCell>
        <TableCell align="right" sx={{ color: '#666' }}>
          {formatCurrency(car.averageRentalPrice)}
        </TableCell>
        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
          {hasContracts ? (
            <MuiTooltip title={`${strings.VIEW_ALL_CONTRACTS} (${contractCount})`}>
              <Badge badgeContent={contractCount} color="primary" max={99}>
                <IconButton 
                  size="small" 
                  onClick={() => setDialogOpen(true)}
                  sx={{ 
                    bgcolor: 'rgba(47, 82, 51, 0.1)',
                    '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.2)' }
                  }}
                >
                  <ContractIcon fontSize="small" sx={{ color: '#2F5233' }} />
                </IconButton>
              </Badge>
            </MuiTooltip>
          ) : (
            <Typography variant="caption" color="text.secondary">-</Typography>
          )}
        </TableCell>
      </TableRow>
      
      {/* Expandable Contracts Section */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3, bgcolor: 'rgba(47, 82, 51, 0.02)', borderRadius: 2, my: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2F5233', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon fontSize="small" />
                {strings.CONTRACTS} ({contractCount})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {car.contracts.slice(0, 5).map((contract: ContractInfo, idx: number) => (
                  <Chip
                    key={idx}
                    icon={<ContractIcon />}
                    label={contract.contractNumber || `#${idx + 1}`}
                    onClick={() => onDownloadContract(contract.bookingId)}
                    sx={{ 
                      bgcolor: '#fff',
                      border: '1px solid rgba(47, 82, 51, 0.2)',
                      '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.1)' }
                    }}
                  />
                ))}
                {contractCount > 5 && (
                  <Chip
                    icon={<ViewIcon />}
                    label={`+${contractCount - 5} ${strings.MORE}`}
                    onClick={() => setDialogOpen(true)}
                    sx={{ 
                      bgcolor: '#2F5233',
                      color: 'white',
                      '&:hover': { bgcolor: '#1E3522' }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      
      {/* Contracts Dialog */}
      <ContractsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${car.carName} - ${strings.CONTRACTS}`}
        contracts={car.contracts || []}
        onDownload={onDownloadContract}
      />
    </>
  )
}

// Expandable Row Component for Customer
interface ExpandableCustomerRowProps {
  customer: any
  formatCurrency: (amount: number) => string
  onDownloadContract: (bookingId: string) => void
}

const ExpandableCustomerRow: React.FC<ExpandableCustomerRowProps> = ({ customer, formatCurrency, onDownloadContract }) => {
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasContracts = customer.contracts && customer.contracts.length > 0
  const contractCount = hasContracts ? customer.contracts.length : 0
  const carCount = customer.carNames?.length || 0
  
  // Truncate display for many cars
  const getCarNamesDisplay = () => {
    if (!customer.carNames || customer.carNames.length === 0) {
      return '-'
    }
    if (customer.carNames.length <= 2) {
      return customer.carNames.join(', ')
    }
    return `${customer.carNames.slice(0, 2).join(', ')} +${customer.carNames.length - 2}`
  }
  
  const getImmatDisplay = () => {
    if (!customer.carImmatriculations || customer.carImmatriculations.length === 0) {
      return '-'
    }
    if (customer.carImmatriculations.length <= 2) {
      return customer.carImmatriculations.join(', ')
    }
    return `${customer.carImmatriculations.slice(0, 2).join(', ')} +${customer.carImmatriculations.length - 2}`
  }
  
  return (
    <>
      <TableRow 
        hover 
        sx={{ 
          '& > *': { borderBottom: expanded ? 'none' : undefined },
          bgcolor: expanded ? 'rgba(47, 82, 51, 0.02)' : undefined,
          cursor: (hasContracts || carCount > 2) ? 'pointer' : 'default'
        }}
        onClick={() => (hasContracts || carCount > 2) && setExpanded(!expanded)}
      >
        <TableCell>
          {(hasContracts || carCount > 2) && (
            <IconButton size="small" sx={{ mr: 1 }}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          )}
          {customer.customerName}
        </TableCell>
        <TableCell sx={{ color: '#666' }}>{customer.customerEmail}</TableCell>
        <TableCell sx={{ color: '#666' }}>
          <MuiTooltip title={carCount > 2 ? strings.CLICK_TO_EXPAND : ''}>
            <span>{getCarNamesDisplay()}</span>
          </MuiTooltip>
        </TableCell>
        <TableCell sx={{ color: '#666' }}>
          <MuiTooltip title={carCount > 2 ? strings.CLICK_TO_EXPAND : ''}>
            <span>{getImmatDisplay()}</span>
          </MuiTooltip>
        </TableCell>
        <TableCell align="center">{customer.rentalCount}</TableCell>
        <TableCell align="center">{customer.totalDaysRented}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>
          {formatCurrency(customer.totalSpent)}
        </TableCell>
        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
          {hasContracts ? (
            <MuiTooltip title={`${strings.VIEW_ALL_CONTRACTS} (${contractCount})`}>
              <Badge badgeContent={contractCount} color="primary" max={99}>
                <IconButton 
                  size="small" 
                  onClick={() => setDialogOpen(true)}
                  sx={{ 
                    bgcolor: 'rgba(47, 82, 51, 0.1)',
                    '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.2)' }
                  }}
                >
                  <ContractIcon fontSize="small" sx={{ color: '#2F5233' }} />
                </IconButton>
              </Badge>
            </MuiTooltip>
          ) : (
            <Typography variant="caption" color="text.secondary">-</Typography>
          )}
        </TableCell>
      </TableRow>
      
      {/* Expandable Details Section */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3, bgcolor: 'rgba(47, 82, 51, 0.02)', borderRadius: 2, my: 1 }}>
              {/* Cars Section */}
              {carCount > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2F5233', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CarIcon fontSize="small" />
                    {strings.RENTED_CARS} ({carCount})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {customer.carNames.map((carName: string, idx: number) => (
                      <Chip
                        key={idx}
                        icon={<CarIcon />}
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{carName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                              {customer.carImmatriculations[idx] || '-'}
                            </Typography>
                          </Box>
                        }
                        sx={{ 
                          height: 'auto',
                          bgcolor: '#fff',
                          border: '1px solid rgba(47, 82, 51, 0.2)',
                          '& .MuiChip-label': { py: 0.5 }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Contracts Section */}
              {hasContracts && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2F5233', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon fontSize="small" />
                    {strings.CONTRACTS} ({contractCount})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {customer.contracts.slice(0, 5).map((contract: ContractInfo, idx: number) => (
                      <Chip
                        key={idx}
                        icon={<ContractIcon />}
                        label={contract.contractNumber || `#${idx + 1}`}
                        onClick={() => onDownloadContract(contract.bookingId)}
                        sx={{ 
                          bgcolor: '#fff',
                          border: '1px solid rgba(47, 82, 51, 0.2)',
                          '&:hover': { bgcolor: 'rgba(47, 82, 51, 0.1)' }
                        }}
                      />
                    ))}
                    {contractCount > 5 && (
                      <Chip
                        icon={<ViewIcon />}
                        label={`+${contractCount - 5} ${strings.MORE}`}
                        onClick={() => setDialogOpen(true)}
                        sx={{ 
                          bgcolor: '#2F5233',
                          color: 'white',
                          '&:hover': { bgcolor: '#1E3522' }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      
      {/* Contracts Dialog */}
      <ContractsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${customer.customerName} - ${strings.CONTRACTS}`}
        contracts={customer.contracts || []}
        onDownload={onDownloadContract}
      />
    </>
  )
}

const FinancialReports = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('thisYear')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [carPage, setCarPage] = useState(0)
  const [customerPage, setCustomerPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Report Data
  const [reportData, setReportData] = useState<any>(null)

  const COLORS = ['#2F5233', '#4A7C4E', '#D4AF37', '#E8D085', '#10b981', '#3b82f6', '#f59e0b', '#ef4444']

  useEffect(() => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (dateRange) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    setStartDate(start)
    setEndDate(end)
  }, [dateRange])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await FinancialReportService.getFinancialReport(
        startDate,
        endDate,
        selectedSupplier || undefined
      )
      setReportData(data)
    } catch (err) {
      console.error('Error loading financial report:', err)
      setError('Failed to load financial report. Please try again.')
      helper.error()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      loadReport()
    }
  }, [startDate, endDate, selectedSupplier])

  const handleExport = async (reportType: string, data: any[]) => {
    try {
      if (!data || data.length === 0) {
        helper.error('No data to export')
        return
      }
      const blob = await FinancialReportService.exportFinancialReport(reportType, data)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `${reportType}-${date}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      helper.info('Report exported successfully')
    } catch (err) {
      console.error('Error exporting report:', err)
      helper.error('Failed to export report. Please try again.')
    }
  }

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} ${strings.TND}`

  const handleDownloadContract = useCallback(async (bookingId: string) => {
    try {
      await ContractService.downloadContract(bookingId)
    } catch (err) {
      console.error('Error downloading contract:', err)
      helper.error()
    }
  }, [])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      if (helper.admin(_user)) {
        const allSuppliers = await SupplierService.getAllSuppliers()
        setSuppliers(allSuppliers)
      }
    }
  }

  const LoadingSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 3 }}>
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
      </Box>
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
    </Box>
  )

  if (loading && !reportData) {
    return (
      <Layout onLoad={onLoad} strict>
        <LoadingSkeleton />
      </Layout>
    )
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="financial-reports" style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0ec 100%)', minHeight: '100vh' }}>
        {/* Header */}
        <Fade in={true} timeout={500}>
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap', 
            gap: { xs: 2, sm: 3 },
            bgcolor: '#fff',
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)',
            border: '1px solid rgba(47, 82, 51, 0.08)'
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#2F5233', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                <ReportIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
                {strings.FINANCIAL_REPORTS}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Comprehensive financial analytics and insights
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }} size="small">
                <InputLabel sx={{ fontWeight: 600 }}>{strings.DATE_RANGE}</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e: SelectChangeEvent) => setDateRange(e.target.value)}
                  label={strings.DATE_RANGE}
                  sx={{ borderRadius: 2, bgcolor: '#fff' }}
                >
                  <MenuItem value="thisMonth">{strings.THIS_MONTH}</MenuItem>
                  <MenuItem value="lastMonth">{strings.LAST_MONTH}</MenuItem>
                  <MenuItem value="last3Months">{strings.LAST_3_MONTHS}</MenuItem>
                  <MenuItem value="last6Months">{strings.LAST_6_MONTHS}</MenuItem>
                  <MenuItem value="thisYear">{strings.THIS_YEAR}</MenuItem>
                  <MenuItem value="lastYear">{strings.LAST_YEAR}</MenuItem>
                </Select>
              </FormControl>

              {helper.admin(user) && suppliers.length > 0 && (
                <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }} size="small">
                  <InputLabel sx={{ fontWeight: 600 }}>{strings.SUPPLIER}</InputLabel>
                  <Select
                    value={selectedSupplier}
                    onChange={(e: SelectChangeEvent) => setSelectedSupplier(e.target.value)}
                    label={strings.SUPPLIER}
                    sx={{ borderRadius: 2, bgcolor: '#fff' }}
                  >
                    <MenuItem value="">{strings.ALL_SUPPLIERS}</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <MuiTooltip title="Refresh Data">
                <IconButton 
                  onClick={() => loadReport()} 
                  disabled={loading}
                  sx={{ 
                    bgcolor: '#2F5233', 
                    color: '#fff',
                    '&:hover': { bgcolor: '#1E3522' },
                    '&:disabled': { bgcolor: '#ccc' }
                  }}
                >
                  <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </IconButton>
              </MuiTooltip>
            </Box>
          </Box>
        </Fade>

        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {reportData && reportData.summary && (
          <Fade in={true} timeout={700}>
            <Box>
            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, sm: 3 }, mb: 4 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #2F5233 0%, #4A7C4E 100%)', 
                color: 'white',
                borderRadius: 4,
                boxShadow: '0 12px 40px rgba(47, 82, 51, 0.3)',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(47, 82, 51, 0.4)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 1 }}>
                        {strings.TOTAL_EARNINGS}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {formatCurrency(reportData.summary.totalEarnings)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <MoneyIcon sx={{ fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
                    <TrendingUpIcon fontSize="small" />
                    <Typography variant="body2">{reportData.summary.totalRentals} {strings.RENTALS}</Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ 
                background: 'linear-gradient(135deg, #D4AF37 0%, #E8D085 100%)', 
                color: '#1E3522',
                borderRadius: 4,
                boxShadow: '0 12px 40px rgba(212, 175, 55, 0.3)',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(212, 175, 55, 0.4)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 1 }}>
                        {strings.PAID_EARNINGS}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {formatCurrency(reportData.summary.paidEarnings)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(30,53,34,0.15)' }}>
                      <CalendarIcon sx={{ fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    {reportData.summary.paidCount} {strings.RENTALS}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
                color: 'white',
                borderRadius: 4,
                boxShadow: '0 12px 40px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(59, 130, 246, 0.4)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 1 }}>
                        {strings.AVERAGE_RENTAL_VALUE}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {formatCurrency(reportData.summary.averageRentalValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <TimerIcon sx={{ fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    {reportData.summary.averageRentalDuration.toFixed(1)} {strings.DAYS} avg
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
                color: 'white',
                borderRadius: 4,
                boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(16, 185, 129, 0.4)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 1 }}>
                        {strings.TOTAL_DAYS_RENTED}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {reportData.summary.totalDaysRented || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <CalendarIcon sx={{ fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    {strings.DAYS} total
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Charts */}
            {reportData.monthlyTrends && reportData.monthlyTrends.length > 0 && reportData.makeEarnings && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)', border: '1px solid rgba(47, 82, 51, 0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233' }}>
                      {strings.MONTHLY_TRENDS}
                    </Typography>
                    <Chip label="Revenue Trend" size="small" sx={{ bgcolor: 'rgba(47, 82, 51, 0.1)', color: '#2F5233', fontWeight: 600 }} />
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.monthlyTrends}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2F5233" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2F5233" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <RechartsTooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                      />
                      <Area type="monotone" dataKey="earnings" stroke="#2F5233" strokeWidth={3} fill="url(#colorEarnings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)', border: '1px solid rgba(47, 82, 51, 0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2F5233' }}>
                    {strings.MAKE_EARNINGS}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.makeEarnings.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="totalEarnings"
                        nameKey="make"
                        paddingAngle={2}
                      >
                        {reportData.makeEarnings.slice(0, 8).map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
            )}

            {/* Tables */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Car Earnings Table - Enhanced with Expandable Rows */}
              {reportData.carEarnings && (
              <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', boxShadow: '0 4px 20px rgba(47, 82, 51, 0.06)', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: { xs: 2, sm: 2.5 }, 
                  borderBottom: '1px solid #e0e0e0', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(47, 82, 51, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CarIcon sx={{ color: '#2F5233' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233', fontSize: { xs: '1rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                        {strings.CAR_EARNINGS}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reportData.carEarnings.length} {strings.VEHICLES_TRACKED}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('carEarnings', reportData.carEarnings)}
                    size="small"
                    sx={{ 
                      borderColor: '#2F5233', 
                      color: '#2F5233', 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      borderRadius: 2,
                      '&:hover': { borderColor: '#1E3522', bgcolor: 'rgba(47, 82, 51, 0.04)' }
                    }}
                  >
                    {strings.EXPORT_CSV}
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CAR_NAME}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.MAKE}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.REGISTRATION}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.RENTAL_COUNT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.TOTAL_DAYS_RENTED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.TOTAL_EARNED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.AVERAGE_PRICE}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CONTRACTS}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.carEarnings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#999' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <CarIcon sx={{ fontSize: 48, color: '#e0e0e0' }} />
                              <Typography>{strings.NO_CAR_DATA}</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.carEarnings
                          .slice(carPage * rowsPerPage, carPage * rowsPerPage + rowsPerPage)
                          .map((car: any) => (
                            <ExpandableCarRow
                              key={car.carId}
                              car={car}
                              formatCurrency={formatCurrency}
                              onDownloadContract={handleDownloadContract}
                            />
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {reportData.carEarnings.length > 0 && (
                  <TablePagination
                    component="div"
                    count={reportData.carEarnings.length}
                    page={carPage}
                    onPageChange={(_e, newPage) => setCarPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(_e) => {
                      setRowsPerPage(parseInt(_e.target.value, 10))
                      setCarPage(0)
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sx={{ borderTop: '1px solid #e0e0e0' }}
                  />
                )}
              </Card>
              )}

              {/* All Customers Table - Enhanced with Expandable Rows */}
              {reportData.allCustomers && (
              <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', boxShadow: '0 4px 20px rgba(47, 82, 51, 0.06)', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: { xs: 2, sm: 2.5 }, 
                  borderBottom: '1px solid #e0e0e0', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(47, 82, 51, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PersonIcon sx={{ color: '#2F5233' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233', fontSize: { xs: '1rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                        {strings.ALL_CUSTOMERS}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reportData.allCustomers.length} {strings.CUSTOMERS_TRACKED}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('allCustomers', reportData.allCustomers)}
                    size="small"
                    sx={{ 
                      borderColor: '#2F5233', 
                      color: '#2F5233', 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      borderRadius: 2,
                      '&:hover': { borderColor: '#1E3522', bgcolor: 'rgba(47, 82, 51, 0.04)' }
                    }}
                  >
                    {strings.EXPORT_CSV}
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CUSTOMER_NAME}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.EMAIL}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CAR_NAMES}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CAR_IMMATRICULATIONS}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.RENTAL_COUNT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.TOTAL_DAYS_RENTED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.TOTAL_SPENT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2F5233', py: 2, bgcolor: '#fafafa' }}>{strings.CONTRACTS}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.allCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#999' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 48, color: '#e0e0e0' }} />
                              <Typography>{strings.NO_CUSTOMER_DATA}</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.allCustomers
                          .slice(customerPage * rowsPerPage, customerPage * rowsPerPage + rowsPerPage)
                          .map((customer: any) => (
                            <ExpandableCustomerRow
                              key={customer.customerId}
                              customer={customer}
                              formatCurrency={formatCurrency}
                              onDownloadContract={handleDownloadContract}
                            />
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {reportData.allCustomers.length > 0 && (
                  <TablePagination
                    component="div"
                    count={reportData.allCustomers.length}
                    page={customerPage}
                    onPageChange={(_e, newPage) => setCustomerPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(_e) => {
                      setRowsPerPage(parseInt(_e.target.value, 10))
                      setCustomerPage(0)
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sx={{ borderTop: '1px solid #e0e0e0' }}
                  />
                )}
              </Card>
              )}
            </Box>
            </Box>
          </Fade>
        )}
      </div>
    </Layout>
  )
}

export default FinancialReports
