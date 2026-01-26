import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Box,
  Container,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip as MuiTooltip,
  Skeleton,
  Fade,
  Zoom
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '../components/Layout'
import { strings } from '../lang/dashboard'
import { strings as commonStrings } from '../lang/common'
import * as BookingService from '@/services/BookingService'
import * as CarService from '@/services/CarService'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import GPSMap from '@/components/GPSMap'
import EnhancedDonutChart from '@/components/EnhancedDonutChart'
import AnimatedRadialChart from '@/components/AnimatedRadialChart'
import AnimatedAreaChart from '@/components/AnimatedAreaChart'

import '@/assets/css/dashboard-new.css'
import '@/assets/css/enhanced-theme.css'

const DashboardNew = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  
  // Check if user is Accountant or Agency Staff and redirect accordingly
  useEffect(() => {
    if (user) {
      if (user.type === bookcarsTypes.UserType.Accountant) {
        navigate('/financial-reports', { replace: true })
      } else if (user.type === bookcarsTypes.UserType.AgencyStaff) {
        navigate('/bookings', { replace: true })
      }
    }
  }, [user, navigate])
  
  // Main stats
  const [totalSales, setTotalSales] = useState(0)
  const [averageBookingValue, setAverageBookingValue] = useState(0)
  const [salesGrowth, setSalesGrowth] = useState(0)
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [currentEarnings, setCurrentEarnings] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  
  // Booking statistics
  const [completedBookings, setCompletedBookings] = useState(0)
  const [cancelledBookings, setCancelledBookings] = useState(0)
  const [pendingBookings, setPendingBookings] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  
  // Vehicle data
  const [availableVehicles, setAvailableVehicles] = useState(0)
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [rentedVehicles, setRentedVehicles] = useState(0)
  
  // Cars by make/model
  const [carsByMake, setCarsByMake] = useState<any[]>([])
  
  // Car inventory
  const [carInventory, setCarInventory] = useState<any[]>([])
  
  // Supplier data
  const [totalSuppliers, setTotalSuppliers] = useState(0)
  const [activeSuppliers, setActiveSuppliers] = useState(0)
  
  // Customer data
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState(0)
  
  // Revenue breakdown
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [dailyRevenue, setDailyRevenue] = useState(0)
  const [averageDailyRevenue, setAverageDailyRevenue] = useState(0)
  
  // Loading state
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Enhanced colors for charts
  const CHART_COLORS = [
    '#C62828', // Red
    '#FFB300', // Yellow/Gold
    '#43A047', // Green
    '#1E88E5', // Blue
    '#E65100', // Orange
    '#7B1FA2', // Purple
  ]

  const fetchDashboardData = async (isRefresh = false) => {
    if (!user) {
      return
    }
    
    try {
      if (isRefresh) {
        setRefreshing(true)
      }
      
      // First fetch suppliers to get all supplier IDs
      const suppliersRes = await SupplierService.getAllSuppliers()
      const supplierIds = admin ? suppliersRes.map((s: any) => s._id) : [user._id ?? '']
      
      // Define all possible booking statuses
      const allStatuses = [
        bookcarsTypes.BookingStatus.Void,
        bookcarsTypes.BookingStatus.Pending,
        bookcarsTypes.BookingStatus.Deposit,
        bookcarsTypes.BookingStatus.Paid,
        bookcarsTypes.BookingStatus.Reserved,
        bookcarsTypes.BookingStatus.Cancelled,
        bookcarsTypes.BookingStatus.PendingApproval,
      ]
      
      const [bookingsRes, carsRes, usersRes] = await Promise.all([
        BookingService.getBookings(
          { suppliers: supplierIds, statuses: allStatuses, user: undefined, car: undefined },
          1,
          1000
        ),
        CarService.getCars(
          '',
          {
            suppliers: [],
            carSpecs: {},
            includeAlreadyBookedCars: true,
            includeComingSoonCars: true
          },
          1,
          1000
        ),
        UserService.getUsers(
          { user: '', types: [bookcarsTypes.UserType.User] },
          '',
          1,
          1000
        )
      ])
      
      // Process bookings data
      let bookings: any[] = []
      if (bookingsRes && Array.isArray(bookingsRes) && bookingsRes.length > 0 && bookingsRes[0]) {
        bookings = bookingsRes[0].resultData || []
        // pageInfo is an array with one element: [{ totalRecords: X }]
        const pageInfo: any = bookingsRes[0].pageInfo
        const totalBookingsCount = (Array.isArray(pageInfo) && pageInfo.length > 0) 
          ? (pageInfo[0]?.totalRecords || 0) 
          : 0
        setTotalBookings(totalBookingsCount)
      }
      
      // Process cars data
      let cars: any[] = []
      if (carsRes) {
        if (Array.isArray(carsRes)) {
          if (carsRes.length > 0 && carsRes[0]) {
            if (carsRes[0].resultData) {
              cars = carsRes[0].resultData
            } else if (Array.isArray(carsRes[0])) {
              cars = carsRes[0]
            } else {
              cars = carsRes
            }
          }
        } else {
          if ((carsRes as any).resultData) {
            cars = (carsRes as any).resultData
          }
        }
      }
      
      // Process users data
      let users: any[] = []
      if (usersRes && Array.isArray(usersRes) && usersRes.length > 0 && usersRes[0]) {
        users = usersRes[0].resultData || []
        const pageInfoUsers: any = usersRes[0].pageInfo
        const totalCustomersCount = (Array.isArray(pageInfoUsers) && pageInfoUsers.length > 0)
          ? (pageInfoUsers[0]?.totalRecords || 0)
          : 0
        setTotalCustomers(totalCustomersCount)
        
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)
        const newCustomers = users.filter((u: any) => {
          if (u._id) {
            const createdDate = new Date(parseInt(u._id.substring(0, 8), 16) * 1000)
            return createdDate >= thisMonth
          }
          return false
        }).length
        setNewCustomersThisMonth(newCustomers)
      }
      
      setTotalSuppliers(suppliersRes.length)
      setActiveSuppliers(suppliersRes.filter((s: any) => !s.blacklisted).length)
      
      // Calculate revenue
      const revenue = bookings.reduce((sum: number, booking: any) => {
        if (booking?.status === bookcarsTypes.BookingStatus.Paid || 
            booking?.status === bookcarsTypes.BookingStatus.Reserved) {
          return sum + (booking?.price || 0)
        }
        return sum
      }, 0)
      setTotalSales(revenue)
      setCurrentEarnings(revenue)
      
      // Monthly revenue
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyRev = bookings.reduce((sum: number, booking: any) => {
        if (booking?.from && (booking.status === bookcarsTypes.BookingStatus.Paid || booking.status === bookcarsTypes.BookingStatus.Reserved)) {
          const bookingDate = new Date(booking.from)
          if (bookingDate >= firstDayOfMonth) {
            return sum + (booking?.price || 0)
          }
        }
        return sum
      }, 0)
      setMonthlyRevenue(monthlyRev)
      
      // Daily revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dailyRev = bookings.reduce((sum: number, booking: any) => {
        if (booking?.from) {
          const bookingDate = new Date(booking.from)
          bookingDate.setHours(0, 0, 0, 0)
          if (bookingDate.getTime() === today.getTime() && (booking.status === bookcarsTypes.BookingStatus.Paid || booking.status === bookcarsTypes.BookingStatus.Reserved)) {
            return sum + (booking?.price || 0)
          }
        }
        return sum
      }, 0)
      setDailyRevenue(dailyRev)
      
      // Average daily revenue
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      setAverageDailyRevenue(monthlyRev / daysInMonth)
      
      // Average booking value
      setAverageBookingValue(bookings.length > 0 ? revenue / bookings.length : 0)
      
      // Sales growth
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const lastMonthRevenue = bookings.reduce((sum: number, booking: any) => {
        if (booking?.from && (booking.status === bookcarsTypes.BookingStatus.Paid || booking.status === bookcarsTypes.BookingStatus.Reserved)) {
          const bookingDate = new Date(booking.from)
          if (bookingDate >= lastMonth && bookingDate <= lastMonthEnd) {
            return sum + (booking?.price || 0)
          }
        }
        return sum
      }, 0)
      setSalesGrowth(lastMonthRevenue > 0 ? ((monthlyRev - lastMonthRevenue) / lastMonthRevenue) * 100 : 0)
      
      // Analytics data (last 12 months)
      const monthsData: any[] = []
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
        
        const monthRevenue = bookings.reduce((sum: number, booking: any) => {
          if (booking?.from && (booking.status === bookcarsTypes.BookingStatus.Paid || booking.status === bookcarsTypes.BookingStatus.Reserved)) {
            const bookingDate = new Date(booking.from)
            if (bookingDate >= monthDate && bookingDate <= monthEnd) {
              return sum + (booking?.price || 0)
            }
          }
          return sum
        }, 0)
        
        monthsData.push({ name: monthName, earnings: monthRevenue })
      }
      setAnalyticsData(monthsData)
      
      // Calculate booking stats
      const completed = bookings.filter((b: any) => b.status === bookcarsTypes.BookingStatus.Paid).length
      const cancelled = bookings.filter((b: any) => b.status === bookcarsTypes.BookingStatus.Cancelled || b.status === bookcarsTypes.BookingStatus.Void).length
      const pending = bookings.filter((b: any) => b.status === bookcarsTypes.BookingStatus.Pending || b.status === bookcarsTypes.BookingStatus.Reserved).length
      const approvals = bookings.filter((b: any) => b.status === bookcarsTypes.BookingStatus.PendingApproval).length
      setCompletedBookings(completed)
      setCancelledBookings(cancelled)
      setPendingBookings(pending)
      setPendingApprovals(approvals)
      
      // Vehicle stats
      const rentedCarIds = new Set<string>()
      bookings.forEach((b: any) => {
        if (
          (b.status === bookcarsTypes.BookingStatus.Paid || b.status === bookcarsTypes.BookingStatus.Reserved) &&
          b.to && new Date(b.to) >= now
        ) {
          const carId = typeof b.car === 'object' ? b.car._id : b.car
          if (carId) {
            rentedCarIds.add(carId.toString())
          }
        }
      })
      
      const available = cars.filter((c: any) => {
        const isNotFullyBooked = !c.fullyBooked
        const isNotComingSoon = !c.comingSoon
        const isNotRented = !rentedCarIds.has(c._id.toString())
        return isNotFullyBooked && isNotComingSoon && isNotRented
      }).length
      
      setAvailableVehicles(available)
      setRentedVehicles(rentedCarIds.size)
      setTotalVehicles(cars.length)
      
      // Cars by make
      const makeModelCount: any = {}
      cars.forEach((car: any) => {
        const fullName = car.name || 'Unknown'
        const make = fullName.split(' ')[0]
        
        if (!makeModelCount[make]) {
          makeModelCount[make] = {}
        }
        
        if (!makeModelCount[make][fullName]) {
          makeModelCount[make][fullName] = 0
        }
        makeModelCount[make][fullName]++
      })
      
      const byMake: any[] = []
      Object.entries(makeModelCount).forEach(([_make, models]: [string, any]) => {
        Object.entries(models).forEach(([modelName, count]: [string, any]) => {
          byMake.push({ name: modelName, value: count })
        })
      })
      byMake.sort((a, b) => b.value - a.value)
      setCarsByMake(byMake)
      
      // Fetch car inventory
      const inventoryRes = await CarService.getCarInventory(admin ? undefined : user._id)
      setCarInventory(inventoryRes || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, admin])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) {
        fetchDashboardData(true)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [user, loading])

  const handleRefresh = async () => {
    setLastUpdated(new Date())
    await fetchDashboardData(true)
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = _user.type === bookcarsTypes.RecordType.Admin
      setUser(_user)
      setAdmin(_admin)
    }
  }

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} TND`
  const formatNumber = (num: number) => num.toLocaleString('en-US')

  const quickActions = [
    { label: strings.NEW_BOOKING, icon: <AddIcon />, path: '/create-booking', color: '#2F5233' },
    { label: commonStrings.CARS, icon: <CarIcon />, path: '/cars', color: '#3b82f6' },
    { label: 'Financial Reports', icon: <AssessmentIcon />, path: '/financial-reports', color: '#D4AF37' },
    { label: 'Calendar', icon: <CalendarIcon />, path: '/scheduler', color: '#10b981' },
  ]

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth={false} className="dashboard-new">
        {loading ? (
          <Box className="dashboard-loading">
            <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: 4 }} />
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 4 }} />
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 4 }} />
              </Box>
            </Box>
          </Box>
        ) : (
          <Fade in={!loading} timeout={500}>
            <Box className="dashboard-content">
              {/* Dashboard Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#2F5233', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssessmentIcon sx={{ fontSize: 36 }} />
                    {strings.DASHBOARD || 'Dashboard'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box className="live-indicator">{strings.LIVE_TRACKING}</Box>
                    <Typography variant="body2" color="text.secondary">
                      {commonStrings.LAST_UPDATE}: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <MuiTooltip title="Refresh Data">
                    <IconButton 
                      onClick={handleRefresh} 
                      disabled={refreshing}
                      sx={{ 
                        bgcolor: '#fff', 
                        boxShadow: 2,
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </IconButton>
                  </MuiTooltip>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-booking')}
                    className="btn-primary"
                    sx={{ borderRadius: 3, px: 3 }}
                  >
                    {strings.NEW_BOOKING}
                  </Button>
                </Box>
              </Box>

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                {quickActions.map((action, index) => (
                  <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }} key={action.label}>
                    <Button
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 1.5, px: 3, borderRadius: 3,
                        bgcolor: '#fff', color: action.color,
                        fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s', border: '2px solid transparent',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          bgcolor: action.color, color: '#fff',
                        }
                      }}
                    >
                      {action.icon}
                      <Box sx={{ ml: 1 }}>{action.label}</Box>
                    </Button>
                  </Zoom>
                ))}
              </Box>

              {/* Pending Approvals Alert - Only visible to Admin */}
              {admin && pendingApprovals > 0 && (
                <Card 
                  className="pending-alert-card"
                  onClick={() => navigate('/bookings?approvals=true')}
                  sx={{ 
                    mb: 3,
                    background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)',
                    border: '3px solid #f57c00',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: 'linear-gradient(90deg, #f57c00 0%, #ff9800 50%, #f57c00 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    },
                    '@keyframes shimmer': {
                      '0%': {
                        backgroundPosition: '200% 0',
                      },
                      '100%': {
                        backgroundPosition: '-200% 0',
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                        {/* Animated Icon */}
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Pulsing background circle */}
                          <Box
                            sx={{
                              position: 'absolute',
                              width: 90,
                              height: 90,
                              borderRadius: '50%',
                              bgcolor: 'rgba(245, 124, 0, 0.2)',
                              animation: 'pulse 2s ease-in-out infinite',
                            }}
                          />
                          <Avatar 
                            className="bell-icon-animated"
                            sx={{ 
                              bgcolor: '#f57c00', 
                              width: 70, 
                              height: 70,
                              boxShadow: '0 8px 24px rgba(245, 124, 0, 0.4)',
                            }}
                          >
                            <NotificationsIcon sx={{ fontSize: 40, color: '#fff' }} />
                          </Avatar>
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip 
                              label="URGENT"
                              size="small"
                              sx={{ 
                                bgcolor: '#d32f2f', 
                                color: '#fff', 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 20,
                                animation: 'pulse 1.5s ease-in-out infinite',
                              }}
                            />
                            <Chip 
                              label="Action Required"
                              size="small"
                              sx={{ 
                                bgcolor: '#ff6f00', 
                                color: '#fff', 
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 800, 
                              color: '#e65100',
                              mb: 0.5,
                              letterSpacing: '-0.5px',
                            }}
                          >
                            {pendingApprovals} Booking{pendingApprovals > 1 ? 's' : ''} Awaiting Approval
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#f57c00', 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <PendingIcon sx={{ fontSize: 18 }} />
                            Click to review and approve pending bookings now
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action Arrow */}
                      <Box 
                        sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: '#e65100',
                            color: '#fff',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(230, 81, 0, 0.4)',
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        >
                          {pendingApprovals}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: '#e65100',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          Review
                          <ArrowForwardIcon 
                            sx={{ 
                              fontSize: 20,
                              animation: 'slideRight 1s ease-in-out infinite',
                              '@keyframes slideRight': {
                                '0%, 100%': {
                                  transform: 'translateX(0)',
                                },
                                '50%': {
                                  transform: 'translateX(4px)',
                                },
                              },
                            }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <Box className="top-stats" sx={{ gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
                {/* Revenue Card */}
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <Card className="stat-card stat-card-sales hover-lift">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography className="stat-label">{strings.TOTAL_SALES}</Typography>
                          <Typography className="stat-value">{formatCurrency(totalSales)}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <MoneyIcon sx={{ fontSize: 28 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        {salesGrowth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                        <Typography sx={{ fontWeight: 700 }}>{Math.abs(salesGrowth).toFixed(1)}%</Typography>
                        <Typography sx={{ fontSize: 12, opacity: 0.8 }}>{strings.FROM_LAST_MONTH}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>

                {/* Bookings Card */}
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Card className="stat-card stat-card-orders hover-lift">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography className="stat-label">{strings.TOTAL_BOOKINGS}</Typography>
                          <Typography className="stat-value">{formatNumber(totalBookings)}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <CalendarIcon sx={{ fontSize: 28 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`${completedBookings} ${strings.COMPLETED}`} sx={{ bgcolor: 'rgba(16,185,129,0.2)', fontWeight: 600 }} />
                        <Chip size="small" label={`${pendingBookings} ${commonStrings.BOOKING_STATUS_PENDING}`} sx={{ bgcolor: 'rgba(245,158,11,0.2)', fontWeight: 600 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>

                {/* Fleet Card */}
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Card className="stat-card stat-card-maintenance hover-lift">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography className="stat-label" sx={{ color: '#1E3522' }}>{strings.AVAILABLE_VEHICLES}</Typography>
                          <Typography className="stat-value" sx={{ color: '#1E3522' }}>{availableVehicles}/{totalVehicles}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(30,53,34,0.15)' }}>
                          <CarIcon sx={{ fontSize: 28, color: '#1E3522' }} />
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}
                          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(30,53,34,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#2F5233' } }}
                        />
                        <Typography sx={{ fontSize: 12, mt: 1, color: '#1E3522', fontWeight: 600 }}>
                          {rentedVehicles} {strings.RENTED.toLowerCase()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>

                {/* Customers Card */}
                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Card className="stat-card hover-lift" sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) !important', color: 'white !important' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography className="stat-label">{strings.TOTAL_CUSTOMERS}</Typography>
                          <Typography className="stat-value">{formatNumber(totalCustomers)}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <PeopleIcon sx={{ fontSize: 28 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <TrendingUpIcon fontSize="small" />
                        <Typography sx={{ fontWeight: 700 }}>+{newCustomersThisMonth}</Typography>
                        <Typography sx={{ fontSize: 12, opacity: 0.9 }}>{strings.NEW_THIS_MONTH.toLowerCase()}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Box>

              {/* Quick Stats Summary - Horizontal Cards */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, 
                gap: 2,
                animation: 'fadeInUp 0.6s ease-out'
              }}>
                {/* Revenue Today */}
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, #fff 0%, #f8faf9 100%)',
                  border: '2px solid rgba(47,82,51,0.08)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(47,82,51,0.12)',
                    borderColor: '#2F5233'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MoneyIcon sx={{ fontSize: 18, color: '#2F5233' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {strings.TODAY_REVENUE}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#2F5233' }}>
                      {formatCurrency(dailyRevenue)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Average Daily */}
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, #fff 0%, #f8faf9 100%)',
                  border: '2px solid rgba(47,82,51,0.08)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(47,82,51,0.12)',
                    borderColor: '#D4AF37'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AssessmentIcon sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {strings.AVG_PER_DAY}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#D4AF37' }}>
                      {formatCurrency(averageDailyRevenue)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Monthly Revenue */}
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, #fff 0%, #f0f8ff 100%)',
                  border: '2px solid rgba(33,150,243,0.08)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(33,150,243,0.12)',
                    borderColor: '#2196F3'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 18, color: '#2196F3' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {strings.THIS_MONTH}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#2196F3' }}>
                      {formatCurrency(monthlyRevenue)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Suppliers */}
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, #fff 0%, #fff8f0 100%)',
                  border: '2px solid rgba(255,152,0,0.08)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(255,152,0,0.12)',
                    borderColor: '#FF9800'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PeopleIcon sx={{ fontSize: 18, color: '#FF9800' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {strings.SUPPLIERS}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF9800' }}>
                      {activeSuppliers}/{totalSuppliers}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: pendingApprovals > 0 
                    ? 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)' 
                    : 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
                  border: pendingApprovals > 0 
                    ? '2px solid #F57C00' 
                    : '2px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.3s',
                  cursor: pendingApprovals > 0 ? 'pointer' : 'default',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: pendingApprovals > 0 
                      ? '0 8px 24px rgba(245,124,0,0.2)' 
                      : '0 8px 24px rgba(0,0,0,0.08)'
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PendingIcon sx={{ 
                        fontSize: 18, 
                        color: pendingApprovals > 0 ? '#F57C00' : '#999',
                        animation: pendingApprovals > 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                      }} />
                      <Typography variant="caption" sx={{ 
                        fontWeight: 700, 
                        color: pendingApprovals > 0 ? '#F57C00' : '#666', 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5 
                      }}>
                        {strings.PENDING}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 900, 
                      color: pendingApprovals > 0 ? '#F57C00' : '#999'
                    }}>
                      {pendingApprovals}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Main Grid */}
              <Box className="main-grid">
                <Box className="left-column">
                  {/* Analytics Chart - Enhanced Area Chart */}
                  <Card className="analytics-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4, minHeight: 300 }}>
                    <CardContent sx={{ p: 3 }}>
                      <AnimatedAreaChart
                        data={analyticsData}
                        title={strings.QUICK_ANALYTICS}
                        totalValue={currentEarnings}
                        formatCurrency={formatCurrency}
                        color="#2F5233"
                        gradientId="earningsGradient"
                      />
                    </CardContent>
                  </Card>

                  {/* Available Vehicles - Animated Radial Chart */}
                  <Card className="vehicles-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4, minHeight: 280 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <AnimatedRadialChart
                        title={strings.AVAILABLE_VEHICLES}
                        value={availableVehicles}
                        total={totalVehicles}
                        color="#2F5233"
                        secondaryColor="#f0f0f0"
                        icon={<CarIcon sx={{ fontSize: 48 }} />}
                        subtitle={`${rentedVehicles} ${strings.RENTED.toLowerCase()}`}
                      />
                    </CardContent>
                  </Card>

                  {/* Three Stats Cards - Moved Up */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                    {/* Booking Status */}
                    <Card className="info-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          📊 {strings.BOOKING_STATUS}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(47,82,51,0.03)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.TOTAL_BOOKINGS}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#2F5233', mt: 0.5 }}>
                              {totalBookings}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(76,175,80,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.COMPLETED}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#4CAF50', mt: 0.5 }}>
                              {completedBookings}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(239,68,68,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.CANCELLED}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#EF4444', mt: 0.5 }}>
                              {cancelledBookings}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Revenue Stats */}
                    <Card className="info-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          💰 {strings.REVENUE_STATS}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(47,82,51,0.03)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.MONTHLY_REVENUE}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#2F5233', mt: 0.5, fontSize: '1rem' }}>
                              {formatCurrency(monthlyRevenue)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(212,175,55,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.DAILY_REVENUE}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#D4AF37', mt: 0.5, fontSize: '1rem' }}>
                              {formatCurrency(dailyRevenue)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(33,150,243,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.AVG_DAILY}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#2196F3', mt: 0.5, fontSize: '1rem' }}>
                              {formatCurrency(averageDailyRevenue)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Customer Stats */}
                    <Card className="info-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2F5233', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          👥 {strings.CUSTOMER_STATS}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(47,82,51,0.03)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.TOTAL_CUSTOMERS}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#2F5233', mt: 0.5 }}>
                              {totalCustomers}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(76,175,80,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.NEW_THIS_MONTH}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#4CAF50', mt: 0.5 }}>
                              +{newCustomersThisMonth}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(255,152,0,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {strings.ACTIVE_SUPPLIERS}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF9800', mt: 0.5 }}>
                              {activeSuppliers}/{totalSuppliers}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                <Box className="right-column">
                  {/* Cars by Make - Enhanced Donut Chart */}
                  <Card className="make-chart-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)',
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <CarIcon sx={{ fontSize: 24, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', flex: 1, fontSize: '1rem' }}>{strings.CARS_BY_MAKE}</Typography>
                      <Chip
                        label={`${strings.TOP} 3`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          backdropFilter: 'blur(10px)',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 2.5, minHeight: 280 }}>
                      <EnhancedDonutChart
                        data={carsByMake.slice(0, 3).map((item, index) => ({
                          name: item.name,
                          value: item.value,
                          color: CHART_COLORS[index % CHART_COLORS.length],
                        }))}
                        showLegend={true}
                        showLabels={false}
                        innerRadius={50}
                        outerRadius={90}
                        height={280}
                      />
                    </CardContent>
                  </Card>

                  {/* Car Inventory - Enhanced Design */}
                  <Card className="make-chart-card" sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden', mt: 3, height: 550 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #2F5233 0%, #4A7C4E 100%)',
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <CarIcon sx={{ fontSize: 24, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', flex: 1, fontSize: '1rem' }}>{strings.CAR_INVENTORY}</Typography>
                      <Chip
                        label={`${carInventory.length} ${strings.MODELS}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          backdropFilter: 'blur(10px)',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 0, height: 'calc(100% - 72px)' }}>
                      {carInventory.length > 0 ? (
                        <Box sx={{ height: '100%', overflowY: 'auto' }}>
                          {carInventory.map((item: any, index: number) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.75,
                                borderBottom: index < carInventory.length - 1 ? '1px solid #f0f0f0' : 'none',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: '#f8faf9',
                                  transform: 'translateX(4px)',
                                  borderLeft: '4px solid #2F5233',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #2F5233 0%, #4A7C4E 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    boxShadow: '0 4px 12px rgba(47,82,51,0.2)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.name.charAt(0)}
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.25, fontSize: '0.85rem' }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 500, fontSize: '0.7rem' }}>
                                    {strings.FLEET_VEHICLE}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                                <Chip
                                  icon={<CarIcon sx={{ fontSize: 12 }} />}
                                  label={`${item.totalUnits} ${strings.TOTAL}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#2F523315',
                                    color: '#2F5233',
                                    fontWeight: 700,
                                    border: '1.5px solid #2F5233',
                                    fontSize: '0.65rem',
                                    height: 22,
                                  }}
                                />
                                <Chip
                                  label={`${item.availableUnits} ${strings.AVAILABLE}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#4CAF50',
                                    color: 'white',
                                    fontWeight: 700,
                                    boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
                                    fontSize: '0.65rem',
                                    height: 22,
                                  }}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                          <CarIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>
                            {commonStrings.NO_DATA || 'No cars in inventory'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Add vehicles to see them here
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* GPS Fleet Tracking - Real-time Location */}
                  <Card sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          <CarIcon sx={{ fontSize: 24, color: '#fff' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                          {commonStrings.FLEET_TRACKING}
                        </Typography>
                      </Box>
                      <Chip 
                        label={commonStrings.LIVE_VEHICLE_TRACKING} 
                        size="small" 
                        sx={{
                          bgcolor: 'rgba(76,175,80,0.9)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <GPSMap autoRefresh={true} refreshInterval={30000} />
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>
    </Layout>
  )
}

export default DashboardNew
