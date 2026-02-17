import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Avatar, 
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import * as BookingService from '@/services/BookingService'
import { strings } from '@/lang/staff-activity'

import '@/assets/css/enhanced-theme.css'

interface StaffMetrics {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  approved: number
  rejected: number
  pending: number
  approvalRate: string
  revenue: number
}

interface StaffActivity {
  staff: {
    _id: string
    fullName: string
    email: string
    avatar?: string
  }
  metrics: StaffMetrics
  recentBookings: any[]
}

const StaffActivity = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffActivity, setStaffActivity] = useState<StaffActivity[]>([])

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      if (_admin) {
        loadStaffActivity()
      } else {
        setLoading(false)
      }
    }
  }

  const loadStaffActivity = async () => {
    try {
      const data = await BookingService.getStaffActivity()
      setStaffActivity(data)
      setLoading(false)
    } catch (err) {
      helper.error(err)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && admin && (
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0ec 100%)', minHeight: '100vh' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#2F5233' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2F5233' }}>
                  {strings.STAFF_ACTIVITY_DASHBOARD}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {strings.MONITOR_PERFORMANCE}
                </Typography>
              </Box>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          ) : staffActivity.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <PersonIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {strings.NO_STAFF_MEMBERS}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {strings.CREATE_STAFF_ACCOUNTS}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
              {staffActivity.map((activity) => (
                <Box key={activity.staff._id}>
                  <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(47, 82, 51, 0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Staff Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar 
                          src={activity.staff.avatar} 
                          sx={{ width: 60, height: 60, bgcolor: '#2F5233' }}
                        >
                          {activity.staff.fullName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {activity.staff.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.staff.email}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${activity.metrics.total} ${strings.TOTAL}`}
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {/* Quick Stats */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                        <Box>
                          <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                              {activity.metrics.today}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {strings.TODAY}
                            </Typography>
                          </Paper>
                        </Box>
                        <Box>
                          <Paper sx={{ p: 2, bgcolor: '#f3e5f5', textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                              {activity.metrics.thisWeek}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {strings.THIS_WEEK}
                            </Typography>
                          </Paper>
                        </Box>
                        <Box>
                          <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f57c00' }}>
                              {activity.metrics.thisMonth}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {strings.THIS_MONTH}
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>

                      {/* Approval Metrics */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {strings.APPROVAL_RATE}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2F5233' }}>
                            {activity.metrics.approvalRate}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={parseFloat(activity.metrics.approvalRate)}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: parseFloat(activity.metrics.approvalRate) >= 70 ? '#4caf50' : '#f57c00'
                            }
                          }}
                        />
                      </Box>

                      {/* Status Breakdown */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 20, color: '#4caf50' }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {activity.metrics.approved}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {strings.APPROVED}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PendingIcon sx={{ fontSize: 20, color: '#f57c00' }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {activity.metrics.pending}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {strings.PENDING}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CancelIcon sx={{ fontSize: 20, color: '#f44336' }} />
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {activity.metrics.rejected}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {strings.REJECTED}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {/* Revenue */}
                      <Box 
                        sx={{ 
                          mt: 2, 
                          p: 2, 
                          bgcolor: '#e8f5e9', 
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ color: '#2e7d32' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                            {strings.TOTAL_REVENUE}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                          {formatCurrency(activity.metrics.revenue)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}

          {/* Summary Table */}
          {!loading && staffActivity.length > 0 && (
            <Paper sx={{ mt: 4, borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: '#2F5233', color: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {strings.PERFORMANCE_SUMMARY}
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{strings.STAFF_MEMBER}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.TOTAL_BOOKINGS}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.APPROVED}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.PENDING}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.REJECTED}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.APPROVAL_RATE}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{strings.TOTAL_REVENUE}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffActivity.map((activity) => (
                      <TableRow key={activity.staff._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={activity.staff.avatar} sx={{ width: 32, height: 32 }}>
                              {activity.staff.fullName.charAt(0)}
                            </Avatar>
                            {activity.staff.fullName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{activity.metrics.total}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={activity.metrics.approved} 
                            size="small" 
                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={activity.metrics.pending} 
                            size="small" 
                            sx={{ bgcolor: '#fff3e0', color: '#f57c00', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={activity.metrics.rejected} 
                            size="small" 
                            sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                            <TrendingUpIcon 
                              sx={{ 
                                fontSize: 18, 
                                color: parseFloat(activity.metrics.approvalRate) >= 70 ? '#4caf50' : '#f57c00' 
                              }} 
                            />
                            {activity.metrics.approvalRate}%
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatCurrency(activity.metrics.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}
    </Layout>
  )
}

export default StaffActivity
