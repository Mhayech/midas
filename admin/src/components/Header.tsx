import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  MenuItem,
  Menu,
  Button,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box
} from '@mui/material'
import {
  Menu as MenuIcon,
  Mail as MailIcon,
  Notifications as NotificationsIcon,
  More as MoreIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  CorporateFare as SuppliersIcon,
  LocationOn as LocationsIcon,
  DirectionsCar as CarsIcon,
  People as UsersIcon,
  InfoTwoTone as AboutIcon,
  DescriptionTwoTone as TosIcon,
  ExitToApp as SignoutIcon,
  Flag as CountriesIcon,
  CalendarMonth as SchedulerIcon,
  AccountBalance as BankDetailsIcon,
  MonetizationOn as PricingIcon,
  Assessment as FinancialReportsIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/lang/header'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as BankDetailsService from '@/services/BankDetailsService'
import Avatar from './Avatar'
import * as langHelper from '@/utils/langHelper'
import * as helper from '@/utils/helper'
import { useNotificationContext, NotificationContextType } from '@/context/NotificationContext'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/header.css'

interface HeaderProps {
  hidden?: boolean
}

const Header = ({
  hidden,
}: HeaderProps) => {
  const navigate = useNavigate()

  const { user } = useUserContext() as UserContextType
  const { notificationCount } = useNotificationContext() as NotificationContextType

  const [currentUser, setCurrentUser] = useState<bookcarsTypes.User>()
  const [lang, setLang] = useState(helper.getLanguage(env.DEFAULT_LANGUAGE))
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<HTMLElement | null>(null)
  const [sideAnchorEl, setSideAnchorEl] = useState<HTMLElement | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [bankDetails, setBankDetails] = useState<bookcarsTypes.BankDetails | null>(null)

  const isMenuOpen = Boolean(anchorEl)
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl)
  const isLangMenuOpen = Boolean(langAnchorEl)
  const isSideMenuOpen = Boolean(sideAnchorEl)

  const classes = {
    list: {
      width: 250,
    },
    formControl: {
      margin: 1,
      minWidth: 120,
    },
    selectEmpty: {
      marginTop: 2,
    },
    grow: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: 2,
    },
  }

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null)
  }

  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget)
  }

  const refreshPage = () => {
    // const params = new URLSearchParams(window.location.search)

    // if (params.has('l')) {
    //   params.delete('l')
    //   // window.location.href = window.location.href.split('?')[0] + ([...params].length > 0 ? `?${params}` : '')
    //   window.location.replace(window.location.href.split('?')[0] + ([...params].length > 0 ? `?${params}` : ''))
    // } else {
    //   // window.location.reload()
    //   window.location.replace(window.location.href)
    // }
    navigate(0)
  }

  const handleLangMenuClose = async (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(null)

    const { code } = event.currentTarget.dataset
    if (code) {
      setLang(helper.getLanguage(code))
      const currentLang = UserService.getLanguage()
      if (isSignedIn && user) {
        // Update user language
        const data: bookcarsTypes.UpdateLanguagePayload = {
          id: user._id as string,
          language: code,
        }
        const status = await UserService.updateLanguage(data)
        if (status === 200) {
          UserService.setLanguage(code)
          if (code && code !== currentLang) {
            // Refresh page
            refreshPage()
          }
        } else {
          toast(commonStrings.CHANGE_LANGUAGE_ERROR, { type: 'error' })
        }
      } else {
        UserService.setLanguage(code)
        if (code && code !== currentLang) {
          // Refresh page
          refreshPage()
        }
      }
    }
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    handleMobileMenuClose()
  }

  const handleSettingsClick = () => {
    handleMenuClose()
    navigate('/settings')
  }

  const handleSignout = async () => {
    handleMenuClose()
    await UserService.signout()
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget)
  }

  const handleSideMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSideAnchorEl(event.currentTarget)
  }

  const handleSideMenuClose = () => {
    setSideAnchorEl(null)
  }

  const handleNotificationsClick = () => {
    navigate('/notifications')
  }

  useEffect(() => {
    const language = langHelper.getLanguage()
    setLang(helper.getLanguage(language))
    langHelper.setLanguage(strings, language)
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentUser(user)
      setIsSignedIn(true)
    } else {
      setCurrentUser(undefined)
      setIsSignedIn(false)
    }
  }, [user])

  useEffect(() => {
    const init = async () => {
      if (!hidden) {
        if (currentUser) {
          const _bankDetails = await BankDetailsService.getBankDetails()
          setBankDetails(_bankDetails)

          setIsSignedIn(true)
          setIsLoaded(true)
        }
      }
    }

    init()
  }, [hidden, currentUser])

  const menuId = 'primary-account-menu'
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      className="menu"
    >
      <MenuItem onClick={handleSettingsClick}>
        <SettingsIcon className="header-action" />
        <Typography>{strings.SETTINGS}</Typography>
      </MenuItem>
      <MenuItem onClick={handleSignout}>
        <SignoutIcon className="header-action" />
        <Typography>{strings.SIGN_OUT}</Typography>
      </MenuItem>
    </Menu>
  )

  const mobileMenuId = 'mobile-menu'
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      className="menu"
    >
      <MenuItem onClick={handleSettingsClick}>
        <SettingsIcon className="header-action" />
        <p>{strings.SETTINGS}</p>
      </MenuItem>
      <MenuItem onClick={handleLangMenuOpen}>
        <LanguageIcon className="header-action" />
        <p>{strings.LANGUAGE}</p>
      </MenuItem>
      <MenuItem onClick={handleSignout}>
        <SignoutIcon className="header-action" />
        <p>{strings.SIGN_OUT}</p>
      </MenuItem>
    </Menu>
  )

  const languageMenuId = 'language-menu'
  const renderLanguageMenu = (
    <Menu
      anchorEl={langAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={languageMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isLangMenuOpen}
      onClose={handleLangMenuClose}
      className="menu"
    >
      {
        env._LANGUAGES.map((language) => (
          <MenuItem onClick={handleLangMenuClose} data-code={language.code} key={language.code}>
            {language.label}
          </MenuItem>
        ))
      }
    </Menu>
  )

  return !hidden && (
    <div style={classes.grow} className="header">
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'linear-gradient(135deg, #2F5233 0%, #4A7C4E 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Toolbar className="toolbar" sx={{ minHeight: '70px !important' }}>
          {isLoaded && isSignedIn && (
            <IconButton 
              edge="start" 
              sx={{ 
                ...classes.menuButton,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }} 
              color="inherit" 
              aria-label="open drawer" 
              onClick={handleSideMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          )}
          <>
            <Drawer 
              open={isSideMenuOpen} 
              onClose={handleSideMenuClose} 
              className="menu side-menu"
              PaperProps={{
                sx: {
                  background: 'linear-gradient(180deg, #2F5233 0%, #1E3522 100%)',
                  color: '#fff',
                  width: 280,
                }
              }}
            >
              <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#D4AF37', mb: 0.5 }}>
                  Midas Rent
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Admin Dashboard
                </Typography>
              </Box>
              <List sx={{ ...classes.list, px: 1, py: 2 }}>
                {/* Dashboard - hidden from Accountant and Agency Staff */}
                {!helper.accountant(currentUser) && !helper.agencyStaff(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.DASHBOARD} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Scheduler - hidden from Accountant only, visible to Agency Staff */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/scheduler')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <SchedulerIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.SCHEDULER} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Suppliers - hidden from Accountant and Staff */}
                {!helper.accountant(currentUser) && !helper.agencyStaff(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/suppliers')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <SuppliersIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.COMPANIES} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Countries - hidden from Accountant */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/countries')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <CountriesIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.COUNTRIES} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Locations - hidden from Accountant */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/locations')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <LocationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.LOCATIONS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Cars - hidden from Accountant, visible to Agency Staff */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/cars')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <CarsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.CARS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Bookings - hidden from Accountant, visible to Agency Staff */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/bookings')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.BOOKINGS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}

                {/* Contracts - visible to Accountant, Admin, and Staff */}
                {(helper.admin(currentUser) || helper.accountant(currentUser) || helper.agencyStaff(currentUser)) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/contracts')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.CONTRACTS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Users - Staff can create Drivers only, Accountant cannot access */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/users')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <UsersIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.USERS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Pricing - hidden from Accountant */}
                {!helper.accountant(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/pricing')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <PricingIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.PRICING} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Financial Reports - visible to Accountant and Admin only, hidden from Staff */}
                {!helper.agencyStaff(currentUser) && (
                  <ListItemButton
                  onClick={() => {
                    navigate('/financial-reports')
                    handleSideMenuClose()
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.15)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                    <FinancialReportsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={strings.FINANCIAL_REPORTS} 
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItemButton>
                )}
                
                {/* Staff Activity - Only visible to Admin */}
                {helper.admin(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/staff-activity')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <AssessmentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.STAFF_ACTIVITY} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                {bankDetails?.showBankDetailsPage && !helper.agencyStaff(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/bank-details')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <BankDetailsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.BANK_DETAILS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
                
                {/* Settings - hidden from Staff and Accountant */}
                {!helper.accountant(currentUser) && !helper.agencyStaff(currentUser) && (
                  <ListItemButton
                    onClick={() => {
                      navigate('/settings')
                      handleSideMenuClose()
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#D4AF37', minWidth: 40 }}>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strings.SETTINGS} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                )}
              </List>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
              <List sx={{ px: 1 }}>
                <ListItemButton
                  onClick={() => {
                    navigate('/about')
                    handleSideMenuClose()
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.15)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                    <AboutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={strings.ABOUT}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    navigate('/tos')
                    handleSideMenuClose()
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.15)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                    <TosIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={strings.TOS}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    navigate('/contact')
                    handleSideMenuClose()
                  }}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.15)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                    <MailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={strings.CONTACT}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                  />
                </ListItemButton>
              </List>
            </Drawer>
          </>
          <div style={classes.grow} />
          <div className="header-desktop">
            {isSignedIn && (
              <IconButton aria-label="" color="inherit" onClick={handleNotificationsClick}>
                <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
            {isLoaded && (
              <Button 
                variant="contained" 
                startIcon={<LanguageIcon />} 
                onClick={handleLangMenuOpen} 
                disableElevation 
                className="btn-primary"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                  },
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 600,
                }}
              >
                {lang?.label}
              </Button>
            )}
            {isSignedIn && user && (
              <IconButton edge="end" aria-label="account" aria-controls={menuId} aria-haspopup="true" onClick={handleAccountMenuOpen} color="inherit">
                <Avatar record={user} type={user.type} size="small" readonly />
              </IconButton>
            )}
          </div>
          <div className="header-mobile">
            {!isSignedIn && (
              <Button 
                variant="contained" 
                startIcon={<LanguageIcon />} 
                onClick={handleLangMenuOpen} 
                disableElevation 
                className="btn-primary"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                  },
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 600,
                }}
              >
                {lang?.label}
              </Button>
            )}
            {isSignedIn && (
              <IconButton color="inherit" onClick={handleNotificationsClick}>
                <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
            {isSignedIn && (
              <IconButton aria-label="show more" aria-controls={mobileMenuId} aria-haspopup="true" onClick={handleMobileMenuOpen} color="inherit">
                <MoreIcon />
              </IconButton>
            )}
          </div>
        </Toolbar>
      </AppBar>

      {renderMobileMenu}
      {renderMenu}
      {renderLanguageMenu}
    </div>
  )
}

export default Header
