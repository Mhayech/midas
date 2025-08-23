import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as CarStateService from '@/services/CarStateService'
import * as CarService from '@/services/CarService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import { strings as csrStrings } from '@/lang/car-state-report'
import '@/assets/css/car-state-report.css'

const schema = z.object({
  stateType: z.enum([
    bookcarsTypes.CarState.PreRental,
    bookcarsTypes.CarState.PostRental,
  ]),
  date: z.string(),
  time: z.string(),
  mileage: z.number().min(0),
  fuelLevel: z.number().min(0).max(100),
  bodyCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  interiorCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  adminNotes: z.string().optional(),
  customerNotes: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

interface CarStateReportProps {
  car: bookcarsTypes.Car
  booking?: bookcarsTypes.Booking
  location: bookcarsTypes.Location
  onStateChange?: () => void
  registerPdfHandler?: (handler: () => void) => void
}

const CarStateReport = ({ car, booking, location, onStateChange, registerPdfHandler }: CarStateReportProps) => {
  const [carStates, setCarStates] = useState<bookcarsTypes.CarStateInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editingState, setEditingState] = useState<bookcarsTypes.CarStateInfo | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      stateType: bookcarsTypes.CarState.PreRental,
      date: bookcarsHelper.formatDate(new Date()),
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      mileage: 0,
      fuelLevel: 100,
      bodyCondition: 'excellent',
      interiorCondition: 'excellent',
      adminNotes: '',
      customerNotes: '',
    },
  })

  useEffect(() => {
    loadCarStates()
  }, [car._id, booking?._id])

  const loadCarStates = async () => {
    try {
      setLoading(true)
      let states: bookcarsTypes.CarStateInfo[] = []
      
      if (booking?._id) {
        states = await CarStateService.getCarStatesByBooking(booking._id)
      } else {
        states = await CarStateService.getCarStatesByCar(car._id)
      }
      
      setCarStates(states)
    } catch (error) {
      console.error('Error loading car states:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBeforeState = () => 
    carStates.find(state => state.stateType === bookcarsTypes.CarState.PreRental)

  const getAfterState = () => 
    carStates.find(state => state.stateType === bookcarsTypes.CarState.PostRental)

  const handleCreateState = async (data: FormFields) => {
    try {
      const currentUser = UserService.getCurrentUser()
      if (!currentUser?._id) {
        console.error('No authenticated user found')
        return
      }

      // Upload photo if provided
      let photos: bookcarsTypes.CarStatePhoto[] | undefined
      if (photoFile) {
        try {
          const tempUrl = await CarService.createImage(photoFile)
          photos = [{
            url: tempUrl,
            caption: `${data.stateType} photo`,
            uploadedAt: new Date(),
            uploadedBy: currentUser._id,
          } as unknown as bookcarsTypes.CarStatePhoto]
        } catch (e) {
          console.error('Photo upload failed', e)
        }
      }

      const payload: bookcarsTypes.CreateCarStatePayload = {
        car: car._id,
        booking: booking?._id,
        stateType: data.stateType,
        location: location._id,
        date: new Date(data.date),
        time: data.time,
        mileage: data.mileage,
        fuelLevel: data.fuelLevel,
        bodyCondition: data.bodyCondition,
        interiorCondition: data.interiorCondition,
        adminNotes: data.adminNotes,
        customerNotes: data.customerNotes,
        admin: currentUser._id, // Use actual authenticated user ID
        photos,
      }

      await CarStateService.create(payload)
      setOpenForm(false)
      reset()
      setPhotoFile(null)
      loadCarStates()
      onStateChange?.()
    } catch (error) {
      console.error('Error creating car state:', error)
    }
  }

  const handleEditState = async (data: FormFields) => {
    if (!editingState) return

    try {
      const currentUser = UserService.getCurrentUser()
      if (!currentUser?._id) {
        console.error('No authenticated user found')
        return
      }

      // Upload new photo if provided
      let photos = editingState.photos
      if (photoFile) {
        try {
          const tempUrl = await CarService.createImage(photoFile)
          photos = [
            ...(editingState.photos || []),
            {
              url: tempUrl,
              caption: `${data.stateType} photo`,
              uploadedAt: new Date(),
              uploadedBy: currentUser._id,
            } as unknown as bookcarsTypes.CarStatePhoto,
          ]
        } catch (e) {
          console.error('Photo upload failed', e)
        }
      }

      const payload: bookcarsTypes.UpdateCarStatePayload = {
        _id: editingState._id!,
        stateType: data.stateType,
        date: new Date(data.date),
        time: data.time,
        mileage: data.mileage,
        fuelLevel: data.fuelLevel,
        bodyCondition: data.bodyCondition,
        interiorCondition: data.interiorCondition,
        adminNotes: data.adminNotes,
        customerNotes: data.customerNotes,
        admin: currentUser._id, // Use actual authenticated user ID
        photos,
      }

      await CarStateService.update(payload)
      setOpenForm(false)
      setEditingState(null)
      reset()
      setPhotoFile(null)
      loadCarStates()
      onStateChange?.()
    } catch (error) {
      console.error('Error updating car state:', error)
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
    setEditingState(null)
    reset()
    setOpenForm(true)
  }

  const openEditForm = (state: bookcarsTypes.CarStateInfo) => {
    setFormMode('edit')
    setEditingState(state)
    reset({
      stateType: state.stateType as bookcarsTypes.CarState.PreRental | bookcarsTypes.CarState.PostRental,
      date: bookcarsHelper.formatDate(new Date(state.date)),
      time: state.time,
      mileage: state.mileage,
      fuelLevel: state.fuelLevel,
      bodyCondition: state.bodyCondition,
      interiorCondition: state.interiorCondition,
      adminNotes: state.adminNotes,
      customerNotes: state.customerNotes,
    })
    setOpenForm(true)
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success'
      case 'good': return 'primary'
      case 'fair': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }

  const formatCondition = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'Excellent'
      case 'good': return 'Good'
      case 'fair': return 'Fair'
      case 'poor': return 'Poor'
      default: return condition
    }
  }

  const beforeState = getBeforeState()
  const afterState = getAfterState()

  // pdfMake is attached to window in main.tsx

  const toAbsoluteUrl = (maybeFilename?: string): string | undefined => {
    if (!maybeFilename) return undefined
    if (helper.isValidURL(maybeFilename)) return maybeFilename
    // Prefer temp CDN as uploads for car states are temporary filenames
    return bookcarsHelper.joinURL(env.CDN_TEMP_CARS, maybeFilename)
  }

  const loadImageAsDataUrl = async (url?: string): Promise<string | undefined> => {
    if (!url) return undefined
    try {
      const tempUrl = toAbsoluteUrl(url) || url
      let response = await fetch(tempUrl, { mode: 'cors' })
      if (!response.ok) {
        // fallback to permanent cars CDN
        const carsUrl = helper.isValidURL(url) ? url : bookcarsHelper.joinURL(env.CDN_CARS, url)
        response = await fetch(carsUrl, { mode: 'cors' })
      }
      const blob = await response.blob()
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      return undefined
    }
  }

  const buildConditionChip = (label: string, color: string) => ({
    table: {
      widths: ['*'],
      body: [[{ text: label, color: '#fff', alignment: 'center' }]],
    },
    layout: {
      fillColor: () => (color),
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
    margin: [0, 2, 0, 2],
  })

  const conditionColorHex = (condition?: string) => {
    switch (condition) {
      case 'excellent': return '#2e7d32'
      case 'good': return '#1976d2'
      case 'fair': return '#ed6c02'
      case 'poor': return '#d32f2f'
      default: return '#6b7280'
    }
  }

  const generatePdf = async () => {
    // Lazy-load pdfmake only when needed
    // @ts-ignore
    const pdfMake = (await import('pdfmake/build/pdfmake')).default as any
    // @ts-ignore
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default as any
    const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs
    if (vfs) {
      pdfMake.vfs = vfs
    }
    try {
      setDownloading(true)

      // Prepare images
      const beforeThumbs: string[] = []
      const afterThumbs: string[] = []
      if (beforeState?.photos) {
        for (const p of beforeState.photos.slice(0, 2)) {
          const dataUrl = await loadImageAsDataUrl(typeof p.url === 'string' ? p.url : undefined)
          if (dataUrl) beforeThumbs.push(dataUrl)
        }
      }
      if (afterState?.photos) {
        for (const p of afterState.photos.slice(0, 2)) {
          const dataUrl = await loadImageAsDataUrl(typeof p.url === 'string' ? p.url : undefined)
          if (dataUrl) afterThumbs.push(dataUrl)
        }
      }

      // Logo
      const loadLogoDataUrl = async (): Promise<string | undefined> => {
        try {
          const response = await fetch('/favicon.ico', { mode: 'cors' })
          const blob = await response.blob()
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve((reader.result as string) || '')
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch {
          return undefined
        }
      }
      const logo = await loadLogoDataUrl()

      const summaryTableBody: any[] = [
        [
          { text: 'Car', style: 'meta' },
          { text: car.name, style: 'value' },
          { text: 'Registration', style: 'meta' },
          { text: (car as any).registration || 'N/A', style: 'value' },
        ],
        [
          { text: 'Location', style: 'meta' },
          { text: location.name || '—', style: 'value' },
          { text: 'Coordinates', style: 'meta' },
          { text: (location.latitude != null && location.longitude != null) ? `${location.latitude}, ${location.longitude}` : 'N/A', style: 'value' },
        ],
      ]

      if (booking) {
        summaryTableBody.push(
          [
            { text: 'Booking', style: 'meta' },
            { text: `${booking._id?.slice(-8)}…`, style: 'value' },
            { text: 'Driver', style: 'meta' },
            { text: typeof booking.driver === 'object' ? booking.driver.fullName : '—', style: 'value' },
          ],
          [
            { text: 'From', style: 'meta' },
            { text: new Date(booking.from).toLocaleString(), style: 'value' },
            { text: 'To', style: 'meta' },
            { text: new Date(booking.to).toLocaleString(), style: 'value' },
          ],
        )
      }

      const comparisonTable = {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: [
            [{ text: 'Metric', style: 'tableHeader' }, { text: 'Pre-Rental', style: 'tableHeader' }, { text: 'Post-Rental', style: 'tableHeader' }],
            ['Mileage (km)', beforeState?.mileage ?? '—', afterState?.mileage ?? '—'],
            ['Fuel Level (%)', beforeState?.fuelLevel ?? '—', afterState?.fuelLevel ?? '—'],
            ['Body', { stack: [buildConditionChip(formatCondition(beforeState?.bodyCondition || ''), conditionColorHex(beforeState?.bodyCondition))] }, { stack: [buildConditionChip(formatCondition(afterState?.bodyCondition || ''), conditionColorHex(afterState?.bodyCondition))] }],
            ['Interior', { stack: [buildConditionChip(formatCondition(beforeState?.interiorCondition || ''), conditionColorHex(beforeState?.interiorCondition))] }, { stack: [buildConditionChip(formatCondition(afterState?.interiorCondition || ''), conditionColorHex(afterState?.interiorCondition))] }],
          ],
        },
        layout: 'lightHorizontalLines' as const,
        margin: [0, 8, 0, 0],
      }

      const notesSection = {
        columns: [
          {
            width: '50%',
            stack: [
              { text: csrStrings.PRE_RENTAL_TITLE + ' - ' + csrStrings.TITLE, style: 'section' },
              { text: `${csrStrings.ADMIN_NOTES}: ${beforeState?.adminNotes?.trim() ? beforeState?.adminNotes : csrStrings.NOTHING_WRITTEN}` , fontSize: 9 },
              { text: `${csrStrings.CUSTOMER_NOTES}: ${beforeState?.customerNotes?.trim() ? beforeState?.customerNotes : csrStrings.NOTHING_WRITTEN}` , fontSize: 9 },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: csrStrings.POST_RENTAL_TITLE + ' - ' + csrStrings.TITLE, style: 'section' },
              { text: `${csrStrings.ADMIN_NOTES}: ${afterState?.adminNotes?.trim() ? afterState?.adminNotes : csrStrings.NOTHING_WRITTEN}`, fontSize: 9 },
              { text: `${csrStrings.CUSTOMER_NOTES}: ${afterState?.customerNotes?.trim() ? afterState?.customerNotes : csrStrings.NOTHING_WRITTEN}`, fontSize: 9 },
            ],
          },
        ],
        columnGap: 12,
        margin: [0, 6, 0, 6],
      }

      const photoGrid = (caption: string, images: string[]) => ({
        stack: [
          { text: caption, style: 'subTitle', margin: [0, 8, 0, 4] },
          {
            columns: images.map((src) => ({ image: src, width: 90, margin: [0, 2, 8, 2] })),
            columnGap: 8,
          },
        ],
      })

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [24, 30, 24, 30],
        content: [
          {
            columns: [
              logo ? { image: logo, width: 36 } : { text: '' },
              { text: csrStrings.TITLE, style: 'title', alignment: 'right' },
            ],
            margin: [0, 0, 0, 6],
          },
          { text: `${car.name}`, style: 'subTitle' },
          { text: new Date().toLocaleString(), style: 'date' },
          { text: csrStrings.SUMMARY, style: 'section' },
          {
            table: {
              widths: ['auto', '*', 'auto', '*'],
              body: summaryTableBody,
            },
            layout: 'lightHorizontalLines',
            margin: [0, 6, 0, 12],
          },
          ...(booking ? [
            { text: csrStrings.PRICING, style: 'section' },
            {
              table: {
                widths: ['auto', '*', 'auto', '*'],
                body: [
                  [
                    { text: csrStrings.TOTAL, style: 'meta' },
                    { text: bookcarsHelper.formatPrice(booking.price || 0, commonStrings.CURRENCY, 'en'), style: 'value' },
                    { text: csrStrings.DAYS, style: 'meta' },
                    { text: (() => { const ms = new Date(booking.to).getTime() - new Date(booking.from).getTime(); return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24))) })().toString(), style: 'value' },
                  ],
                  [
                    { text: csrStrings.PRICE_PER_DAY, style: 'meta' },
                    { text: (() => { const ms = new Date(booking.to).getTime() - new Date(booking.from).getTime(); const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24))); const perDay = (booking.price || 0) / days; return bookcarsHelper.formatPrice(perDay, commonStrings.CURRENCY, 'en') })(), style: 'value' },
                    { text: csrStrings.DEPOSIT, style: 'meta' },
                    { text: booking.isDeposit ? 'Yes' : 'No', style: 'value' },
                  ],
                ],
              },
              layout: 'lightHorizontalLines',
              margin: [0, 6, 0, 12],
            },
          ] : []),
          { text: csrStrings.METRIC, style: 'section' },
          comparisonTable,
          notesSection,
          { text: csrStrings.PRE_RENTAL_TITLE, style: 'section', margin: [0, 8, 0, 4] },
          beforeThumbs.length ? photoGrid('', beforeThumbs) : { text: 'No photos', italics: true, color: '#6b7280' },
          { text: csrStrings.POST_RENTAL_TITLE, style: 'section', margin: [0, 8, 0, 4] },
          afterThumbs.length ? photoGrid('', afterThumbs) : { text: 'No photos', italics: true, color: '#6b7280' },
        ],
        styles: {
          title: { fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
          subTitle: { fontSize: 12, color: '#4b5563' },
          date: { fontSize: 9, color: '#6b7280', margin: [0, 2, 0, 8] },
          section: { fontSize: 11, bold: true, margin: [0, 6, 0, 4] },
          meta: { color: '#6b7280' },
          value: { bold: true },
          tableHeader: { bold: true, fillColor: '#f3f4f6' },
        },
        defaultStyle: { fontSize: 9 },
      }

      const fileName = `car-state-${car._id}${booking?._id ? `-${booking._id}` : ''}.pdf`
      pdfMake.createPdf(docDefinition).download(fileName)
    } finally {
      setDownloading(false)
    }
  }

  // Expose PDF generator to parent so the button can live in the summary header
  useEffect(() => {
    if (registerPdfHandler) {
      registerPdfHandler(() => { void generatePdf() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerPdfHandler, car?._id, booking?._id, location?._id])

  return (
    <Box className="car-state-report">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} className="csr-header">
        <Typography variant="h4" component="h1">{csrStrings.TITLE}</Typography>
      </Box>

      {/* Car Information */}
      <Card sx={{ mb: 3 }} className="csr-card">
        <CardContent>
          <Typography variant="h6" gutterBottom className="csr-section-title">
            {csrStrings.CAR_INFO}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="csr-meta">{csrStrings.CATEGORY}</Typography>
              <Typography variant="body1">{car.range}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="csr-meta">{csrStrings.MODEL}</Typography>
              <Typography variant="body1">{car.name}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="csr-meta">{csrStrings.REGISTRATION}</Typography>
              <Typography variant="body1">{car.registration || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* State Comparison */}
      <Grid container spacing={3}>
        {/* Pick-up State */}
        <Grid item xs={12} md={6}>
          <Card className="csr-card">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="primary">{csrStrings.PRE_RENTAL_TITLE}</Typography>
                {beforeState && (
                  <IconButton size="small" onClick={() => openEditForm(beforeState)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {beforeState ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.DATE}</Typography>
                      <Typography variant="body1">
                        {bookcarsHelper.formatDate(new Date(beforeState.date))}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.TIME}</Typography>
                      <Typography variant="body1">{beforeState.time}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.MILEAGE_KM}</Typography>
                      <Typography variant="body1">{beforeState.mileage} km</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.FUEL_LEVEL_PERCENT}</Typography>
                      <Typography variant="body1">{beforeState.fuelLevel}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.BODY}</Typography>
                      <Chip 
                        label={formatCondition(beforeState.bodyCondition)}
                        color={getConditionColor(beforeState.bodyCondition)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.INTERIOR}</Typography>
                      <Chip 
                        label={formatCondition(beforeState.interiorCondition)}
                        color={getConditionColor(beforeState.interiorCondition)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      {beforeState.photos && beforeState.photos.length > 0 ? (
                        <Box display="flex" gap={1.2} flexWrap="wrap" mt={1}>
                          {beforeState.photos.map((p, idx) => {
                            const filename = typeof p.url === 'string' ? p.url : undefined
                            const src = toAbsoluteUrl(filename) || ''
                            const fallback = filename ? bookcarsHelper.joinURL(env.CDN_CARS, filename) : ''
                            return (
                              <img
                                key={idx}
                                src={src}
                                alt={p.caption || ''}
                                className="csr-thumb"
                                onError={(e) => { const t = e.target as HTMLImageElement; if (fallback && t.src !== fallback) t.src = fallback }}
                              />
                            )
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">{csrStrings.NO_PHOTO}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">{csrStrings.ADMIN_NOTES}</Typography>
                      <Typography variant="body1">{beforeState.adminNotes?.trim() ? beforeState.adminNotes : csrStrings.NOTHING_WRITTEN}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{csrStrings.CUSTOMER_NOTES}</Typography>
                      <Typography variant="body1">{beforeState.customerNotes?.trim() ? beforeState.customerNotes : csrStrings.NOTHING_WRITTEN}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="textSecondary">{csrStrings.CREATE_PICKUP}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      reset({ 
                        stateType: bookcarsTypes.CarState.PreRental,
                        date: bookcarsHelper.formatDate(new Date()),
                        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        mileage: 0,
                        fuelLevel: 100,
                        bodyCondition: 'excellent',
                        interiorCondition: 'excellent',
                        adminNotes: '',
                        customerNotes: '',
                      })
                      setFormMode('create')
                      setOpenForm(true)
                    }}
                    sx={{ mt: 1 }}
                  >
                    {csrStrings.CREATE_PICKUP}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Drop-off State */}
        <Grid item xs={12} md={6}>
          <Card className="csr-card">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="secondary">{csrStrings.POST_RENTAL_TITLE}</Typography>
                {afterState && (
                  <IconButton size="small" onClick={() => openEditForm(afterState)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
              
              {afterState ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.DATE}</Typography>
                      <Typography variant="body1">
                        {bookcarsHelper.formatDate(new Date(afterState.date))}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.TIME}</Typography>
                      <Typography variant="body1">{afterState.time}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.MILEAGE_KM}</Typography>
                      <Typography variant="body1">{afterState.mileage} km</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.FUEL_LEVEL_PERCENT}</Typography>
                      <Typography variant="body1">{afterState.fuelLevel}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.BODY}</Typography>
                      <Chip 
                        label={formatCondition(afterState.bodyCondition)}
                        color={getConditionColor(afterState.bodyCondition)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">{csrStrings.INTERIOR}</Typography>
                      <Chip 
                        label={formatCondition(afterState.interiorCondition)}
                        color={getConditionColor(afterState.interiorCondition)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      {afterState.photos && afterState.photos.length > 0 ? (
                        <Box display="flex" gap={1.2} flexWrap="wrap" mt={1}>
                          {afterState.photos.map((p, idx) => {
                            const filename = typeof p.url === 'string' ? p.url : undefined
                            const src = toAbsoluteUrl(filename) || ''
                            const fallback = filename ? bookcarsHelper.joinURL(env.CDN_CARS, filename) : ''
                            return (
                              <img
                                key={idx}
                                src={src}
                                alt={p.caption || ''}
                                className="csr-thumb"
                                onError={(e) => { const t = (e.target as HTMLImageElement); if (fallback && t.src !== fallback) t.src = fallback }}
                              />
                            )
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">{csrStrings.NO_PHOTO}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">{csrStrings.ADMIN_NOTES}</Typography>
                      <Typography variant="body1">{afterState.adminNotes?.trim() ? afterState.adminNotes : csrStrings.NOTHING_WRITTEN}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{csrStrings.CUSTOMER_NOTES}</Typography>
                      <Typography variant="body1">{afterState.customerNotes?.trim() ? afterState.customerNotes : csrStrings.NOTHING_WRITTEN}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="textSecondary">{csrStrings.CREATE_DROPOFF}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      reset({ 
                        stateType: bookcarsTypes.CarState.PostRental,
                        date: bookcarsHelper.formatDate(new Date()),
                        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        mileage: 0,
                        fuelLevel: 100,
                        bodyCondition: 'excellent',
                        interiorCondition: 'excellent',
                        adminNotes: '',
                        customerNotes: '',
                      })
                      setFormMode('create')
                      setOpenForm(true)
                    }}
                    sx={{ mt: 1 }}
                  >
                    {csrStrings.CREATE_DROPOFF}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth className="car-state-dialog">
        <DialogTitle>
          {formMode === 'create' ? 'Create Car State' : 'Edit Car State'}
        </DialogTitle>
        <form onSubmit={handleSubmit(formMode === 'create' ? handleCreateState : handleEditState)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="stateType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>State Type</InputLabel>
                      <Select {...field} label="State Type">
                        <MenuItem value={bookcarsTypes.CarState.PreRental}>Pre-Rental</MenuItem>
                        <MenuItem value={bookcarsTypes.CarState.PostRental}>Post-Rental</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} alignItems="center">
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />}> 
                    {csrStrings.UPLOAD_PHOTO}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0]
                        setPhotoFile(file || null)
                      }}
                    />
                  </Button>
                  {photoFile && (
                    <Typography variant="body2" color="textSecondary">{photoFile.name}</Typography>
                  )}
                </Box>
              </Grid>
              {photoFile && (
                <Grid item xs={12}>
                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">Preview</Typography>
                    <Box mt={1}>
                      <img 
                        src={URL.createObjectURL(photoFile)} 
                        alt="preview" 
                        className="csr-preview"
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Controller
                  name="mileage"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Mileage (km)"
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="fuelLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Fuel Level (%)"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="bodyCondition"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Body Condition</InputLabel>
                      <Select {...field} label="Body Condition">
                        <MenuItem value="excellent">Excellent</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="fair">Fair</MenuItem>
                        <MenuItem value="poor">Poor</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="interiorCondition"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Interior Condition</InputLabel>
                      <Select {...field} label="Interior Condition">
                        <MenuItem value="excellent">Excellent</MenuItem>
                        <MenuItem value="good">Good</MenuItem>
                        <MenuItem value="fair">Fair</MenuItem>
                        <MenuItem value="poor">Poor</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="adminNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Admin Notes"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="customerNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Customer Notes"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
            >
              {formMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default CarStateReport
