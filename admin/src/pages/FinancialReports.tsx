import React, { useState, useEffect } from 'react'
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
  TablePagination
} from '@mui/material'
import {
  Download as DownloadIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Description as ContractIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MoneyIcon,
  Timer as TimerIcon
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

const FinancialReports = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('thisYear') // Changed from 'thisMonth' to show more data by default
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

  const handleDownloadContract = async (bookingId: string) => {
    try {
      await ContractService.downloadContract(bookingId)
    } catch (err) {
      console.error('Error downloading contract:', err)
      helper.error()
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
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
              {/* Car Earnings Table */}
              {reportData.carEarnings && (
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {strings.CAR_EARNINGS}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('carEarnings', reportData.carEarnings)}
                    size="small"
                    sx={{ borderColor: '#ccc', color: '#555', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {strings.EXPORT_CSV}
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CAR_NAME}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.MAKE}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.REGISTRATION}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.RENTAL_COUNT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.TOTAL_DAYS_RENTED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.TOTAL_EARNED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.AVERAGE_PRICE}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CONTRACTS}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.carEarnings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>
                            No car rental data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.carEarnings
                          .slice(carPage * rowsPerPage, carPage * rowsPerPage + rowsPerPage)
                          .map((car: any) => (
                          <TableRow key={car.carId} hover>
                            <TableCell>{car.carName}</TableCell>
                            <TableCell sx={{ color: '#666' }}>{car.carMake}</TableCell>
                            <TableCell sx={{ color: '#666' }}>{car.immatriculation}</TableCell>
                            <TableCell align="center">{car.rentalCount}</TableCell>
                            <TableCell align="center">{car.totalDaysRented}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(car.totalEarnings)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#666' }}>{formatCurrency(car.averageRentalPrice)}</TableCell>
                            <TableCell align="center">
                              {car.contracts && car.contracts.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  {car.contracts.slice(0, 2).map((contract: any, idx: number) => (
                                    <MuiTooltip key={idx} title={contract.contractNumber}>
                                      <IconButton size="small" onClick={() => handleDownloadContract(contract.bookingId)}>
                                        <ContractIcon fontSize="small" />
                                      </IconButton>
                                    </MuiTooltip>
                                  ))}
                                  {car.contracts.length > 2 && (
                                    <Typography variant="caption" color="text.secondary">+{car.contracts.length - 2}</Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
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
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </Card>
              )}

              {/* All Customers Table */}
              {reportData.allCustomers && (
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {strings.ALL_CUSTOMERS}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('allCustomers', reportData.allCustomers)}
                    size="small"
                    sx={{ borderColor: '#ccc', color: '#555', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {strings.EXPORT_CSV}
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CUSTOMER_NAME}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.EMAIL}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CAR_NAMES}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CAR_IMMATRICULATIONS}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.RENTAL_COUNT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.TOTAL_DAYS_RENTED}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.TOTAL_SPENT}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333', py: 1.5 }}>{strings.CONTRACTS}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.allCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>
                            No customers found
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.allCustomers
                          .slice(customerPage * rowsPerPage, customerPage * rowsPerPage + rowsPerPage)
                          .map((customer: any) => (
                          <TableRow key={customer.customerId} hover>
                            <TableCell>{customer.customerName}</TableCell>
                            <TableCell sx={{ color: '#666' }}>{customer.customerEmail}</TableCell>
                            <TableCell sx={{ color: '#666' }}>{customer.carNamesDisplay}</TableCell>
                            <TableCell sx={{ color: '#666' }}>{customer.carImmatriculationsDisplay}</TableCell>
                            <TableCell align="center">{customer.rentalCount}</TableCell>
                            <TableCell align="center">{customer.totalDaysRented}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(customer.totalSpent)}
                            </TableCell>
                            <TableCell align="center">
                              {customer.contracts && customer.contracts.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  {customer.contracts.slice(0, 2).map((contract: any, idx: number) => (
                                    <MuiTooltip key={idx} title={contract.contractNumber}>
                                      <IconButton size="small" onClick={() => handleDownloadContract(contract.bookingId)}>
                                        <ContractIcon fontSize="small" />
                                      </IconButton>
                                    </MuiTooltip>
                                  ))}
                                  {customer.contracts.length > 2 && (
                                    <Typography variant="caption" color="text.secondary">+{customer.contracts.length - 2}</Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
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
                    rowsPerPageOptions={[5, 10, 25]}
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
