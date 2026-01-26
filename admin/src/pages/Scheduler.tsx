import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Box, Typography, Paper, Divider, Fab, Tab, Tabs, AppBar } from '@mui/material'
import { Add as AddIcon, FilterList as FilterIcon, CalendarToday as CalendarIcon, DriveEta as CarIcon, Person as PersonIcon, Event as EventIcon, ViewWeek as TimelineIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/lang/bookings'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as SupplierService from '@/services/SupplierService'
import VehicleScheduler from '@/components/VehicleScheduler'
import SupplierFilter from '@/components/SupplierFilter'
import StatusFilter from '@/components/StatusFilter'
import VehicleSchedulerFilter from '@/components/VehicleSchedulerFilter'

import Layout from '@/components/Layout'

import '@/assets/css/scheduler.css'
import '@/assets/css/enhanced-theme.css'

const Scheduler = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [leftPanel, setLeftPanel] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>()
  const [statuses, setStatuses] = useState(helper.getBookingStatuses().map((status) => status.value))
  const [filter, setFilter] = useState<bookcarsTypes.Filter | null>()
  const [showFilters, setShowFilters] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleSupplierFilterChange = (_suppliers: string[]) => {
    setSuppliers(_suppliers)
  }

  const handleStatusFilterChange = (_statuses: bookcarsTypes.BookingStatus[]) => {
    setStatuses(_statuses)
  }

  const handleVehicleSchedulerFilterSubmit = (_filter: bookcarsTypes.Filter | null) => {
    setFilter(_filter)
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      const _isStaff = helper.agencyStaff(_user)
      setUser(_user)
      setAdmin(_admin)
      setLeftPanel(!_admin)

      // Admin and Agency Staff see all bookings
      const _allSuppliers = await SupplierService.getAllSuppliers()
      const _suppliers = (_admin || _isStaff) ? bookcarsHelper.flattenSuppliers(_allSuppliers) : [_user._id ?? '']
      setAllSuppliers(_allSuppliers)
      setSuppliers(_suppliers)
      setLeftPanel(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && suppliers && (
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
                  <TimelineIcon />
                </Box>
                <Typography variant="h6" className="sidebar-title">
                  Scheduler Filters
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
                
                {(admin || helper.agencyStaff(user)) && (
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
                    <EventIcon fontSize="small" />
                    Schedule
                  </Typography>
                  <VehicleSchedulerFilter
                    onSubmit={handleVehicleSchedulerFilterSubmit}
                    className="cl-scheduler-filter"
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
          <Box sx={{ flex: 1, borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)' }}>
            <AppBar position="static" color="default" sx={{ background: 'transparent', boxShadow: 'none', borderBottom: '1px solid #e0e0e0', borderRadius: '8px 8px 0 0' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                variant="fullWidth" 
                sx={{ minHeight: 48 }}
              >
                <Tab label="Timeline View" sx={{ textTransform: 'none', fontWeight: 600 }} />
                <Tab label="Calendar View" sx={{ textTransform: 'none', fontWeight: 600 }} />
              </Tabs>
            </AppBar>
            
            <VehicleScheduler
              suppliers={suppliers}
              statuses={statuses}
              filter={filter!}
              language={user.language!}
            />
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
        </Box>
      )}
    </Layout>
  )
}

export default Scheduler
