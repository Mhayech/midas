import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Box, Typography, Paper, Divider, Fab, Card, CardContent, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Checkbox, Chip } from '@mui/material'
import { Add as AddIcon, FilterList as FilterIcon, CalendarToday as CalendarIcon, DriveEta as CarIcon, Person as PersonIcon, Receipt as ReceiptIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, HourglassEmpty as PendingIcon, CheckBox as CheckBoxIcon, CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/bookings'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import BookingList from '@/components/BookingList'
import SupplierFilter from '@/components/SupplierFilter'
import StatusFilter from '@/components/StatusFilter'
import BookingFilter from '@/components/BookingFilter'
import ApprovalTimeline from '@/components/ApprovalTimeline'
import * as SupplierService from '@/services/SupplierService'
import * as BookingService from '@/services/BookingService'

import '@/assets/css/bookings.css'
import '@/assets/css/enhanced-theme.css'

const Bookings = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [leftPanel, setLeftPanel] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>()
  const [statuses, setStatuses] = useState(helper.getBookingStatuses().map((status) => status.value))
  const [filter, setFilter] = useState<bookcarsTypes.Filter | null>()
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [offset, setOffset] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [pendingApprovals, setPendingApprovals] = useState<bookcarsTypes.Booking[]>([])
  const [showApprovals, setShowApprovals] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<bookcarsTypes.Booking | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false)
  const [bulkRejectionNotes, setBulkRejectionNotes] = useState('')
  const [expandedBookings, setExpandedBookings] = useState<string[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (user) {
      const col1 = document.querySelector('div.col-1')
      if (col1) {
        setOffset(col1.clientHeight)
      }
    }
    
    // Check if redirected from dashboard with approvals=true (only on initial load)
    if (isInitialLoad) {
      const showApprovalsParam = searchParams.get('approvals')
      if (showApprovalsParam === 'true' && admin) {
        setShowApprovals(true)
        // Filter to only show pending approvals
        setStatuses([bookcarsTypes.BookingStatus.PendingApproval])
      }
      setIsInitialLoad(false)
    }
  }, [user, admin, isInitialLoad, searchParams])

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleSupplierFilterChange = (_suppliers: string[]) => {
    setSuppliers(_suppliers)
  }

  const handleStatusFilterChange = (_statuses: bookcarsTypes.BookingStatus[]) => {
    setStatuses(_statuses)
  }

  const handleBookingFilterSubmit = (_filter: bookcarsTypes.Filter | null) => {
    setFilter(_filter)
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      const _isStaff = helper.agencyStaff(_user)
      
      // Fetch suppliers - Admin and Agency Staff see all bookings
      const _allSuppliers = await SupplierService.getAllSuppliers()
      const _suppliers = (_admin || _isStaff) ? bookcarsHelper.flattenSuppliers(_allSuppliers) : [_user._id ?? '']
      
      // Batch all state updates together after data is loaded
      setUser(_user)
      setAdmin(_admin)
      setAllSuppliers(_allSuppliers)
      setSuppliers(_suppliers)
      setLeftPanel(true)
      setShowFilters(true)
      setLoadingSuppliers(false)

      // Load pending approvals for admin (don't await to prevent blocking)
      if (_admin) {
        loadPendingApprovals()
      }
    }
  }

  const loadPendingApprovals = async () => {
    try {
      const approvals = await BookingService.getPendingApprovals()
      setPendingApprovals(approvals)
    } catch (err) {
      helper.error(err)
    }
  }

  const handleApprove = async (bookingId: string) => {
    if (!user?._id) {
      return
    }
    try {
      const updatedBooking = await BookingService.approveBooking(bookingId, user._id)
      helper.info(commonStrings.BOOKING_APPROVED)
      // Navigate to the updated booking detail page
      if (updatedBooking && updatedBooking._id) {
        navigate(`/update-booking?b=${updatedBooking._id}`)
      } else {
        await loadPendingApprovals()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleReject = async (bookingId: string) => {
    if (!user?._id) {
      return
    }
    try {
      const updatedBooking = await BookingService.rejectBooking(bookingId, user._id, rejectionNotes)
      helper.info(commonStrings.BOOKING_REJECTED)
      // Navigate to the updated booking detail page
      if (updatedBooking && updatedBooking._id) {
        navigate(`/update-booking?b=${updatedBooking._id}`)
      } else {
        await loadPendingApprovals()
      }
      setRejectDialogOpen(false)
      setSelectedBooking(null)
      setRejectionNotes('')
    } catch (err) {
      helper.error(err)
    }
  }

  const openRejectDialog = (booking: bookcarsTypes.Booking) => {
    setSelectedBooking(booking)
    setRejectDialogOpen(true)
  }

  const closeRejectDialog = () => {
    setRejectDialogOpen(false)
    setSelectedBooking(null)
    setRejectionNotes('')
  }

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings((prev) => 
      prev.includes(bookingId) 
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedBookings.length === pendingApprovals.length) {
      setSelectedBookings([])
    } else {
      setSelectedBookings(pendingApprovals.map((b) => b._id).filter((id): id is string => !!id))
    }
  }

  const handleBulkApprove = async () => {
    if (!user?._id || selectedBookings.length === 0) {
      return
    }
    try {
      await Promise.all(
        selectedBookings.map((bookingId) => 
          BookingService.approveBooking(bookingId, user._id!)
        )
      )
      helper.info(`${selectedBookings.length} booking(s) approved successfully`)
      await loadPendingApprovals()
      setSelectedBookings([])
    } catch (err) {
      helper.error(err)
    }
  }

  const openBulkRejectDialog = () => {
    if (selectedBookings.length === 0) {
      helper.error('Please select at least one booking to reject')
      return
    }
    setBulkRejectDialogOpen(true)
  }

  const closeBulkRejectDialog = () => {
    setBulkRejectDialogOpen(false)
    setBulkRejectionNotes('')
  }

  const handleBulkReject = async () => {
    if (!user?._id || selectedBookings.length === 0) {
      return
    }
    try {
      await Promise.all(
        selectedBookings.map((bookingId) => 
          BookingService.rejectBooking(bookingId, user._id!, bulkRejectionNotes)
        )
      )
      helper.info(`${selectedBookings.length} booking(s) rejected successfully`)
      await loadPendingApprovals()
      setSelectedBookings([])
      setBulkRejectDialogOpen(false)
      setBulkRejectionNotes('')
    } catch (err) {
      helper.error(err)
    }
  }

  const toggleBookingHistory = (bookingId: string) => {
    setExpandedBookings((prev) => 
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    )
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, height: '100%', p: 3, gap: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0ec 100%)', minHeight: '100vh' }}>
          {/* Enhanced Sidebar */}
          {leftPanel && (
            <Paper 
              elevation={0}
              className="enhanced-sidebar"
              sx={{ 
                width: { xs: '100%', lg: showFilters ? '300px' : '70px' }, 
                borderRadius: 4, 
                p: 3, 
                transition: 'all 0.3s',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box className="sidebar-header" sx={{ display: showFilters ? 'flex' : 'none' }}>
                <Box className="sidebar-header-icon">
                  <ReceiptIcon />
                </Box>
                <Typography variant="h6" className="sidebar-title">
                  Booking Filters
                </Typography>
              </Box>
              
              <Divider sx={{ display: showFilters ? 'block' : 'none' }} />
              
              <Box sx={{ display: showFilters ? 'block' : 'none', flex: 1 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  className="btn-primary" 
                  size="medium" 
                  onClick={() => navigate('/create-booking')}
                  sx={{ mb: 3, width: '100%', py: 1.5, borderRadius: 3 }}
                >
                  {strings.NEW_BOOKING}
                </Button>
                
                {/* Pending Approvals - Only visible to Admin */}
                {admin && pendingApprovals.length > 0 && (
                  <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PendingIcon sx={{ color: '#f57c00' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100' }}>
                          {commonStrings.PENDING_APPROVAL}
                        </Typography>
                      </Box>
                      <Badge badgeContent={pendingApprovals.length} color="warning" />
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => setShowApprovals(!showApprovals)}
                      sx={{ borderRadius: 2 }}
                    >
                      {showApprovals ? 'Hide' : 'View'} Approvals
                    </Button>
                  </Paper>
                )}
                
                {admin && (
                  <Box className="filter-section">
                    <Typography className="filter-section-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      Supplier
                    </Typography>
                    <SupplierFilter
                      suppliers={allSuppliers}
                      onChange={handleSupplierFilterChange}
                      className="cl-supplier-filter"
                    />
                  </Box>
                )}
                
                <Box className="filter-section">
                  <Typography className="filter-section-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" />
                    Status
                  </Typography>
                  <StatusFilter
                    onChange={handleStatusFilterChange}
                    className="cl-status-filter"
                  />
                </Box>
                
                <Box className="filter-section">
                  <Typography className="filter-section-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CarIcon fontSize="small" />
                    Booking Details
                  </Typography>
                  <BookingFilter
                    onSubmit={handleBookingFilterSubmit}
                    language={(user && user.language) || env.DEFAULT_LANGUAGE}
                    className="cl-booking-filter"
                    collapse={false}
                  />
                </Box>
              </Box>
              
              {/* Collapsed filter button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={toggleFilters}
                  sx={{ borderRadius: 3, minWidth: 'auto' }}
                >
                  <FilterIcon />
                </Button>
              </Box>
            </Paper>
          )}
          
          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Pending Approvals List */}
            {admin && showApprovals && pendingApprovals.length > 0 && (
              <Paper elevation={0} sx={{ borderRadius: 4, p: 3, background: '#fff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pending Approvals ({pendingApprovals.length})
                    </Typography>
                    {selectedBookings.length > 0 && (
                      <Chip 
                        label={`${selectedBookings.length} selected`}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  {/* Bulk Actions */}
                  {selectedBookings.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<ApproveIcon />}
                        onClick={handleBulkApprove}
                      >
                        Approve Selected ({selectedBookings.length})
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<RejectIcon />}
                        onClick={openBulkRejectDialog}
                      >
                        Reject Selected ({selectedBookings.length})
                      </Button>
                    </Box>
                  )}
                </Box>
                
                {/* Select All Checkbox */}
                <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={selectedBookings.length === pendingApprovals.length && pendingApprovals.length > 0}
                      indeterminate={selectedBookings.length > 0 && selectedBookings.length < pendingApprovals.length}
                      onChange={toggleSelectAll}
                      icon={<CheckBoxOutlineBlankIcon />}
                      checkedIcon={<CheckBoxIcon />}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Select All ({pendingApprovals.length})
                    </Typography>
                  </Box>
                </Box>
                {pendingApprovals.map((booking) => {
                  const isExpanded = expandedBookings.includes(booking._id || '')
                  return (
                  <Card key={booking._id} sx={{ mb: 2, borderLeft: '4px solid #f57c00' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 2 }}>
                        {/* Checkbox */}
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, flex: 1 }}>
                          <Checkbox
                            checked={selectedBookings.includes(booking._id || '')}
                            onChange={() => toggleBookingSelection(booking._id || '')}
                            icon={<CheckBoxOutlineBlankIcon />}
                            checkedIcon={<CheckBoxIcon />}
                            sx={{ mt: -1 }}
                          />
                          <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {(booking.car as any)?.name || 'Car'}
                            </Typography>
                            {booking.createdBy && (
                              <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1, py: 0.5, borderRadius: 1 }}>
                                Created by: {(booking.createdBy as any)?.fullName || 'Staff'}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Driver: {(booking.driver as any)?.fullName || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(booking.from).toLocaleDateString()} - {new Date(booking.to).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                            ${(booking.price || 0).toFixed(2)}
                          </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleApprove(booking._id || '')}
                            >
                              {commonStrings.APPROVE}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<RejectIcon />}
                              onClick={() => openRejectDialog(booking)}
                            >
                              {commonStrings.REJECT}
                            </Button>
                          </Box>
                          {(booking.createdBy || booking.approvedBy || booking.rejectedBy) && (
                            <Button
                              variant="text"
                              size="small"
                              endIcon={
                                <ExpandMoreIcon 
                                  sx={{ 
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s',
                                  }}
                                />
                              }
                              onClick={() => toggleBookingHistory(booking._id || '')}
                              sx={{ mt: 0.5 }}
                            >
                              {isExpanded ? 'Hide' : 'View'} History
                            </Button>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Approval History Timeline */}
                      {isExpanded && (booking.createdBy || booking.approvedBy || booking.rejectedBy) && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <ApprovalTimeline booking={booking} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )
                })}
              </Paper>
            )}
            
            {/* Bookings List */}
            <Box sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)' }}>
              <BookingList
                containerClassName="bookings"
                offset={offset}
                language={user.language}
                loggedUser={user}
                suppliers={suppliers}
                statuses={statuses}
                filter={filter}
                loading={loadingSuppliers}
                hideDates={env.isMobile}
                checkboxSelection={!env.isMobile}
              />
            </Box>
          </Box>
          
          {/* Floating Action Button for Mobile */}
          <Fab 
            color="primary" 
            aria-label="add booking" 
            onClick={() => navigate('/create-booking')}
            className="fab"
            sx={{ display: { xs: 'flex', lg: 'none' } }}
          >
            <AddIcon />
          </Fab>
          
          {/* Rejection Dialog */}
          <Dialog 
            open={rejectDialogOpen} 
            onClose={closeRejectDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RejectIcon />
                Reject Booking
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              {selectedBooking && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Car:</strong> {(selectedBooking.car as any)?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Driver:</strong> {(selectedBooking.driver as any)?.fullName || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Dates:</strong> {new Date(selectedBooking.from).toLocaleDateString()} - {new Date(selectedBooking.to).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              <TextField
                label="Rejection Reason (Optional)"
                multiline
                rows={4}
                fullWidth
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Provide a reason for rejection to help the staff member understand..."
                helperText="This note will be sent to the staff member who created this booking"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={closeRejectDialog}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => selectedBooking && handleReject(selectedBooking._id || '')}
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
              >
                Confirm Rejection
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Bulk Rejection Dialog */}
          <Dialog 
            open={bulkRejectDialogOpen} 
            onClose={closeBulkRejectDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RejectIcon />
                Reject {selectedBookings.length} Booking{selectedBookings.length > 1 ? 's' : ''}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  ⚠️ You are about to reject {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All selected bookings will be cancelled and notifications will be sent to the staff members.
                </Typography>
              </Box>
              <TextField
                label="Rejection Reason (Optional)"
                multiline
                rows={4}
                fullWidth
                value={bulkRejectionNotes}
                onChange={(e) => setBulkRejectionNotes(e.target.value)}
                placeholder="Provide a common reason for all rejections..."
                helperText="This note will be sent to all staff members who created these bookings"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                onClick={closeBulkRejectDialog}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkReject}
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
              >
                Confirm Rejection ({selectedBookings.length})
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Layout>
  )
}

export default Bookings
