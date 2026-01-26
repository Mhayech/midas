import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Box, Typography, Paper, Divider, Fab, Grid } from '@mui/material'
import { Add as AddIcon, Person as PersonIcon, People as PeopleIcon, Search as SearchIcon, FilterList as FilterIcon, AccountCircle as AccountIcon, Business as BusinessIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/users'
import * as helper from '@/utils/helper'
import UserTypeFilter from '@/components/UserTypeFilter'
import Search from '@/components/Search'
import UserList from '@/components/UserList'

import '@/assets/css/users.css'
import '@/assets/css/enhanced-theme.css'

const Users = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [staff, setStaff] = useState(false)
  const [types, setTypes] = useState<bookcarsTypes.UserType[]>()
  const [keyword, setKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleUserTypeFilterChange = (newTypes: bookcarsTypes.UserType[]) => {
    setTypes(newTypes)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    const _admin = helper.admin(_user)
    const _staff = helper.agencyStaff(_user)
    // Staff can only see and manage Driver users
    const _types = _admin
      ? helper.getUserTypes().map((userType) => userType.value)
      : _staff
      ? [bookcarsTypes.UserType.User]
      : [bookcarsTypes.UserType.Supplier, bookcarsTypes.UserType.User]

    setUser(_user)
    setAdmin(_admin)
    setStaff(_staff)
    setTypes(_types)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, height: '100%', p: 3, gap: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0ec 100%)', minHeight: '100vh' }}>
          {/* Enhanced Sidebar */}
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
                <PeopleIcon />
              </Box>
              <Typography variant="h6" className="sidebar-title">
                User Management
              </Typography>
            </Box>
            
            <Divider sx={{ display: showFilters ? 'block' : 'none' }} />
            
            <Box sx={{ display: showFilters ? 'block' : 'none', flex: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                className="btn-primary" 
                size="medium" 
                onClick={() => navigate('/create-user')}
                sx={{ mb: 3, width: '100%', py: 1.5, borderRadius: 3 }}
              >
                {strings.NEW_USER}
              </Button>
              
              <Box sx={{ mb: 2 }}>
                <Search 
                  onSubmit={handleSearch}
                />
              </Box>
              
              {admin && (
                <Box className="filter-section">
                  <Typography className="filter-section-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountIcon fontSize="small" />
                    User Type
                  </Typography>
                  <UserTypeFilter
                    className="user-type-filter"
                    onChange={handleUserTypeFilterChange}
                  />
                </Box>
              )}
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
          
          {/* Main Content */}
          <Box sx={{ flex: 1, borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(47, 82, 51, 0.08)' }}>
            <UserList
              user={user}
              types={types}
              keyword={keyword}
              checkboxSelection={!env.isMobile && admin}
              hideDesktopColumns={env.isMobile}
            />
          </Box>
          
          {/* Floating Action Button for Mobile */}
          <Fab 
            color="primary" 
            aria-label="add user" 
            onClick={() => navigate('/create-user')}
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

export default Users
