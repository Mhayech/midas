import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { SelectChangeEvent } from '@mui/material/Select'
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<bookcarsTypes.CarStatePhoto[]>([])
  const [downloading, setDownloading] = useState(false)
  const checklistGroups: { key: string; label: string; items: string[] }[] = [
    {
      key: 'exterior',
      label: csrStrings.GROUP_EXTERIOR,
      items: [
        csrStrings.ITEM_BODY_PANELS,
        csrStrings.ITEM_WINDSHIELD,
        csrStrings.ITEM_LIGHTS,
        csrStrings.ITEM_TIRES,
        csrStrings.ITEM_SPARE_TIRE,
        csrStrings.ITEM_SIDE_MIRRORS,
      ],
    },
    {
      key: 'interior',
      label: csrStrings.GROUP_INTERIOR,
      items: [
        csrStrings.ITEM_SEATS_UPHOLSTERY,
        csrStrings.ITEM_SEATBELTS,
        csrStrings.ITEM_CLEANLINESS_ODOR,
      ],
    },
    {
      key: 'electronics',
      label: csrStrings.GROUP_ELECTRONICS,
      items: [
        csrStrings.ITEM_AC,
        csrStrings.ITEM_RADIO_BT,
        csrStrings.ITEM_GPS_NAV,
      ],
    },
  ]

  const defaultIncludedItems = useMemo(() => 
    checklistGroups.flatMap((g) => g.items.map((n: string) => `[${g.label}] ${n}`)),
    [checklistGroups]
  )

  const GROUP_LABELS: Record<string, string[]> = {
    exterior: ['Exterior', 'Extérieur', 'Exterior', csrStrings.GROUP_EXTERIOR],
    interior: ['Interior', 'Intérieur', 'Interior', csrStrings.GROUP_INTERIOR],
    electronics: ['Electronics & Comfort', 'Électronique & Confort', 'Electrónica y confort', csrStrings.GROUP_ELECTRONICS],
  }

  const getGroupKeyFromName = (fullName: string): 'exterior' | 'interior' | 'electronics' | undefined => {
    const m = fullName.match(/^\[(.*?)\]\s/)
    if (!m) return undefined
    const raw = (m[1] || '').toLowerCase()
    for (const key of Object.keys(GROUP_LABELS)) {
      if (GROUP_LABELS[key as keyof typeof GROUP_LABELS].some((s) => s?.toLowerCase() === raw)) return key as any
    }
    return undefined
  }
  const [includedItems, setIncludedItems] = useState<bookcarsTypes.IncludedItem[]>([])

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

  useEffect(() => {
    if (openForm && formMode === 'create') {
      setIncludedItems(
        defaultIncludedItems.map((name: string) => ({ name, isPresent: true, condition: 'good', notes: '' }))
      )
    }
  }, [openForm, formMode, defaultIncludedItems])

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

      let photos: bookcarsTypes.CarStatePhoto[] | undefined
      if (photoFiles.length > 0) {
        try {
          const uploadedPhotos = await Promise.all(
            photoFiles.map(async (file) => {
              const tempUrl = await CarService.createImage(file)
              return {
                url: tempUrl,
                caption: `${data.stateType} photo`,
                uploadedAt: new Date(),
                uploadedBy: currentUser._id,
              } as unknown as bookcarsTypes.CarStatePhoto
            })
          )
          photos = uploadedPhotos
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
        admin: currentUser._id,
        photos,
        includedItems,
      }

      await CarStateService.create(payload)
      setOpenForm(false)
      reset()
      setPhotoFiles([])
      setExistingPhotos([])
      setIncludedItems([])
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

      let photos = existingPhotos
      if (photoFiles.length > 0) {
        try {
          const uploadedPhotos = await Promise.all(
            photoFiles.map(async (file) => {
              const tempUrl = await CarService.createImage(file)
              return {
                url: tempUrl,
                caption: `${data.stateType} photo`,
                uploadedAt: new Date(),
                uploadedBy: currentUser._id,
              } as unknown as bookcarsTypes.CarStatePhoto
            })
          )
          photos = [
            ...existingPhotos,
            ...uploadedPhotos,
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
        admin: currentUser._id, 
        photos,
        includedItems,
      }

      await CarStateService.update(payload)
      setOpenForm(false)
      setEditingState(null)
      reset()
      setPhotoFiles([])
      setExistingPhotos([])
      setIncludedItems([])
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
    setExistingPhotos([])
    setPhotoFiles([])
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
    setIncludedItems(state.includedItems || [])
    setExistingPhotos(state.photos || [])
    setPhotoFiles([])
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
      // Try permanent CDN first
      const carsUrl = helper.isValidURL(url) ? url : bookcarsHelper.joinURL(env.CDN_CARS, url)
      let response = await fetch(carsUrl, { mode: 'cors' })
      if (!response.ok) {
        // fallback to temp CDN
        const tempUrl = toAbsoluteUrl(url) || url
        response = await fetch(tempUrl, { mode: 'cors' })
      }
      const blob = await response.blob()
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      // Silently handle errors - this is expected behavior for missing images
      // No console logging to keep it clean
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

  // Suppress console noise during PDF generation
  const suppressConsoleNoise = () => {
    const originalError = console.error
    const originalLog = console.log
    const originalWarn = console.warn
    
    // Suppress all console output during PDF generation
    console.error = () => {}
    console.log = () => {}
    console.warn = () => {}
    
    return () => {
      console.error = originalError
      console.log = originalLog
      console.warn = originalWarn
    }
  }

  const generatePdf = useCallback(async () => {
    // Lazy-load pdfmake only when needed
    // @ts-ignore
    const pdfMake = (await import('pdfmake/build/pdfmake')).default as any
    // @ts-ignore
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default as any
    const vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs
    if (vfs) {
      pdfMake.vfs = vfs
    }
    // Suppress console noise during PDF generation
    const restoreConsole = suppressConsoleNoise()
    
    try {
      setDownloading(true)
      
      // Clear console to reduce noise from expected 404 errors
      if (process.env.NODE_ENV === 'development') {
        console.clear()
      }

      // Prepare images
      const beforeThumbs: string[] = []
      const afterThumbs: string[] = []
      if (beforeState?.photos) {
        for (const p of beforeState.photos) {
          const dataUrl = await loadImageAsDataUrl(typeof p.url === 'string' ? p.url : undefined)
          if (dataUrl) beforeThumbs.push(dataUrl)
        }
      }
      if (afterState?.photos) {
        for (const p of afterState.photos) {
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

      const formatIncludedItem = (present?: boolean, condition?: string) => {
        if (present == null && !condition) return '—'
        const label = present ? 'P' : 'A'
        const color = present ? '#2e7d32' : '#d32f2f'
        const cond = condition ? ` · ${formatCondition(condition)}` : ''
        return { text: `${label}${cond}` , color }
      }

      const buildIncludedItemsGroupTables = () => {
        const content: any[] = []
        // Use canonical keys to group regardless of locale
        for (const group of checklistGroups) {
          const label = group.label
          const names = new Set<string>()
          ;(beforeState?.includedItems || []).filter(i => getGroupKeyFromName(i.name) === 'exterior' && group.key === 'exterior' || getGroupKeyFromName(i.name) === 'interior' && group.key === 'interior' || getGroupKeyFromName(i.name) === 'electronics' && group.key === 'electronics').forEach(i => names.add(i.name))
          ;(afterState?.includedItems || []).filter(i => getGroupKeyFromName(i.name) === 'exterior' && group.key === 'exterior' || getGroupKeyFromName(i.name) === 'interior' && group.key === 'interior' || getGroupKeyFromName(i.name) === 'electronics' && group.key === 'electronics').forEach(i => names.add(i.name))
          if (names.size === 0) continue
          // Counts
          const total = names.size
          const prePresent = Array.from(names).reduce((acc, n) => {
            const b = (beforeState?.includedItems || []).find(i => i.name === n)
            return acc + (b?.isPresent ? 1 : 0)
          }, 0)
          const postPresent = Array.from(names).reduce((acc, n) => {
            const a = (afterState?.includedItems || []).find(i => i.name === n)
            return acc + (a?.isPresent ? 1 : 0)
          }, 0)

          const rows: any[] = []
          rows.push([{ text: 'Item', style: 'tableHeader' }, { text: 'Pre', style: 'tableHeader' }, { text: 'Post', style: 'tableHeader' }])
          for (const n of Array.from(names)) {
            const itemLabel = n.replace(/^\[[^\]]+\]\s*/, '')
            const b = (beforeState?.includedItems || []).find(i => i.name === n)
            const a = (afterState?.includedItems || []).find(i => i.name === n)
            rows.push([
              itemLabel,
              formatIncludedItem(b?.isPresent, b?.condition),
              formatIncludedItem(a?.isPresent, a?.condition),
            ])
          }
          content.push(
            { text: `${label}  (Pre: ${prePresent}/${total} · Post: ${postPresent}/${total})`, style: 'subTitle', margin: [0, 6, 0, 2] },
            {
              table: { widths: ['*', 70, 70], body: rows },
              layout: {
                fillColor: (rowIndex: number) => (rowIndex % 2 === 1 ? '#fafafa' : null),
                hLineColor: () => '#e5e7eb',
                vLineColor: () => '#e5e7eb',
              },
            }
          )
        }
        return content
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
          { text: csrStrings.INCLUDED_ITEMS, style: 'section' },
          ...buildIncludedItemsGroupTables(),
          { text: 'Photos', style: 'section', margin: [0, 8, 0, 4] },
          ...(beforeThumbs.length || afterThumbs.length ? [
            photoGrid(csrStrings.PRE_RENTAL_TITLE, beforeThumbs),
            photoGrid(csrStrings.POST_RENTAL_TITLE, afterThumbs),
          ] : [{ text: 'No photos', italics: true, color: '#6b7280' }]),
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
      
      // Show success message in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 PDF generated successfully with images!')
        console.log('📄 File downloaded to your downloads folder')
      }
    } finally {
      // Restore console functions
      if (restoreConsole) {
        restoreConsole()
      }
      setDownloading(false)
    }
  }, [car, booking, location, beforeState, afterState, checklistGroups, csrStrings, commonStrings, bookcarsHelper])

  useEffect(() => {
    if (registerPdfHandler) {
      registerPdfHandler(() => { void generatePdf() })
    }
  }, [registerPdfHandler, generatePdf])

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
              <Typography variant="body1">{car.immatriculation || 'N/A'}</Typography>
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
                          <Typography variant="body2" color="textSecondary" sx={{ width: '100%', mb: 1 }}>
                            Photos ({beforeState.photos.length} total)
                          </Typography>
                          {beforeState.photos.map((p, idx) => {
                            const filename = typeof p.url === 'string' ? p.url : undefined
                            const src = toAbsoluteUrl(filename) || ''
                            const fallback = filename ? bookcarsHelper.joinURL(env.CDN_CARS, filename) : ''
                            return (
                              <Box key={idx} position="relative">
                                <img
                                  src={src}
                                  alt={p.caption || `Photo ${idx + 1}`}
                                  className="csr-thumb"
                                  onError={(e) => { 
                                    const t = e.target as HTMLImageElement; 
                                    if (fallback && t.src !== fallback) {
                                      t.src = fallback 
                                    } else {
                                      console.error('Failed to load image:', src, 'fallback:', fallback)
                                    }
                                  }}
                                  onLoad={() => console.log('Image loaded successfully:', src)}
                                />
                                <Typography variant="caption" sx={{ 
                                  position: 'absolute', 
                                  bottom: 4, 
                                  left: 4, 
                                  backgroundColor: 'rgba(0,0,0,0.7)', 
                                  color: 'white', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontSize: '10px'
                                }}>
                                  {idx + 1}
                                </Typography>
                              </Box>
                            )
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">{csrStrings.NO_PHOTO}</Typography>
                      )}
                    </Grid>
                    {beforeState.includedItems && beforeState.includedItems.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <details>
                          <summary style={{ cursor: 'pointer' }}>{csrStrings.INCLUDED_ITEMS}</summary>
                          <Box mt={1}>
                            {checklistGroups.map((g) => {
                              const items = (beforeState.includedItems || []).filter((i) => getGroupKeyFromName(i.name) === g.key)
                              if (!items.length) return null
                              return (
                                <Box key={`b-group-${g.key}`} sx={{ mb: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{g.label}</Typography>
                                  <Grid container spacing={1}>
                                    {items.map((i, idx) => (
                                      <Grid key={`b-inc-${g.key}-${idx}`} item xs={12} sm={6}>
                                        <Grid container alignItems="center" sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                          <Grid item xs={8}>
                                            <Typography variant="body2" sx={{ pr: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {i.name.replace(/^\[[^\]]+\]\s*/, '')}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={4}>
                                            <Box display="flex" gap={1} justifyContent="flex-end">
                                              <Chip size="small" label={i.isPresent ? 'P' : 'A'} color={i.isPresent ? 'success' : 'error'} sx={{ minWidth: 28, justifyContent: 'center' }} />
                                              <Chip size="small" label={formatCondition(i.condition as any)} variant="outlined" sx={{ minWidth: 72, justifyContent: 'center' }} />
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              )
                            })}
                          </Box>
                        </details>
                      </Grid>
                    )}
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
                          <Typography variant="body2" color="textSecondary" sx={{ width: '100%', mb: 1 }}>
                            Photos ({afterState.photos.length} total)
                          </Typography>
                          {afterState.photos.map((p, idx) => {
                            const filename = typeof p.url === 'string' ? p.url : undefined
                            const src = toAbsoluteUrl(filename) || ''
                            const fallback = filename ? bookcarsHelper.joinURL(env.CDN_CARS, filename) : ''
                            return (
                              <Box key={idx} position="relative">
                                <img
                                  src={src}
                                  alt={p.caption || `Photo ${idx + 1}`}
                                  className="csr-thumb"
                                  onError={(e) => { 
                                    const t = e.target as HTMLImageElement; 
                                    if (fallback && t.src !== fallback) {
                                      t.src = fallback 
                                    } else {
                                      console.error('Failed to load image:', src, 'fallback:', fallback)
                                    }
                                  }}
                                  onLoad={() => console.log('Image loaded successfully:', src)}
                                />
                                <Typography variant="caption" sx={{ 
                                  position: 'absolute', 
                                  bottom: 4, 
                                  left: 4, 
                                  backgroundColor: 'rgba(0,0,0,0.7)', 
                                  color: 'white', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontSize: '10px'
                                }}>
                                  {idx + 1}
                                </Typography>
                              </Box>
                            )
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">{csrStrings.NO_PHOTO}</Typography>
                      )}
                    </Grid>
                    {afterState.includedItems && afterState.includedItems.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <details>
                          <summary style={{ cursor: 'pointer' }}>{csrStrings.INCLUDED_ITEMS}</summary>
                          <Box mt={1}>
                            {checklistGroups.map((g) => {
                              const items = (afterState.includedItems || []).filter((i) => getGroupKeyFromName(i.name) === g.key)
                              if (!items.length) return null
                              return (
                                <Box key={`a-group-${g.key}`} sx={{ mb: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{g.label}</Typography>
                                  <Grid container spacing={1}>
                                    {items.map((i, idx) => (
                                      <Grid key={`a-inc-${g.key}-${idx}`} item xs={12} sm={6}>
                                        <Grid container alignItems="center" sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                          <Grid item xs={8}>
                                            <Typography variant="body2" sx={{ pr: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {i.name.replace(/^\[[^\]]+\]\s*/, '')}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={4}>
                                            <Box display="flex" gap={1} justifyContent="flex-end">
                                              <Chip size="small" label={i.isPresent ? 'P' : 'A'} color={i.isPresent ? 'success' : 'error'} sx={{ minWidth: 28, justifyContent: 'center' }} />
                                              <Chip size="small" label={formatCondition(i.condition as any)} variant="outlined" sx={{ minWidth: 72, justifyContent: 'center' }} />
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              )
                            })}
                          </Box>
                        </details>
                      </Grid>
                    )}
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
                      multiple
                      hidden
                      onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : []
                        setPhotoFiles(files)
                      }}
                    />
                  </Button>
                  {(photoFiles.length > 0 || existingPhotos.length > 0) && (
                    <Typography variant="body2" color="textSecondary">
                      {photoFiles.length + existingPhotos.length} photo(s) total
                    </Typography>
                  )}
                </Box>
              </Grid>
              {(photoFiles.length > 0 || existingPhotos.length > 0) && (
                <Grid item xs={12}>
                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      Photos ({existingPhotos.length} existing, {photoFiles.length} new)
                    </Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      {/* Existing photos */}
                      {existingPhotos.map((photo, index) => {
                        const filename = typeof photo.url === 'string' ? photo.url : undefined
                        const src = toAbsoluteUrl(filename) || ''
                        const fallback = filename ? bookcarsHelper.joinURL(env.CDN_CARS, filename) : ''
                        return (
                          <Box key={`existing-${index}`} position="relative">
                            <img 
                              src={src}
                              alt={photo.caption || `existing-${index}`} 
                              className="csr-preview"
                              style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                              onError={(e) => { 
                                const t = e.target as HTMLImageElement; 
                                if (fallback && t.src !== fallback) t.src = fallback 
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                                color: 'white',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.9)' }
                              }}
                              onClick={() => {
                                setExistingPhotos(existingPhotos.filter((_, i) => i !== index))
                              }}
                            >
                              <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 'bold' }}>×</Typography>
                            </IconButton>
                          </Box>
                        )
                      })}
                      {/* New photos */}
                      {photoFiles.map((file, index) => (
                        <Box key={`new-${index}`} position="relative">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`preview-${index}`} 
                            className="csr-preview"
                            style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                            }}
                            onClick={() => {
                              setPhotoFiles(photoFiles.filter((_, i) => i !== index))
                            }}
                          >
                            <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 'bold' }}>×</Typography>
                          </IconButton>
                        </Box>
                      ))}
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

              {/* Included Items Checklist - grouped */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1">Inspection Checklist</Typography>
              </Grid>
              {checklistGroups.map((group) => (
                <Grid key={group.key} item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>{group.label}</Typography>
                  <Grid container spacing={1}>
                    {group.items.map((label) => {
                      const index = includedItems.findIndex((i) => i.name === `[${group.label}] ${label}`)
                      const item = index >= 0 ? includedItems[index] : { name: `[${group.label}] ${label}`, isPresent: true, condition: 'good' as const }
                      return (
                        <Grid key={label} item xs={12} md={6}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={6}>
                              <Typography variant="body2">{label}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={!!item.isPresent}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const copy = [...includedItems]
                                      if (index >= 0) {
                                        copy[index] = { ...copy[index], isPresent: e.target.checked }
                                      } else {
                                        copy.push({ ...item, isPresent: e.target.checked })
                                      }
                                      setIncludedItems(copy)
                                    }}
                                  />
                                }
                                label="Present"
                              />
                            </Grid>
                            <Grid item xs={3}>
                              <FormControl size="small" fullWidth>
                                <InputLabel>Condition</InputLabel>
                                <Select
                                  value={item.condition}
                                  label="Condition"
                                  onChange={(e: SelectChangeEvent) => {
                                    const copy = [...includedItems]
                                    if (index >= 0) {
                                      copy[index] = { ...copy[index], condition: e.target.value as any }
                                    } else {
                                      copy.push({ ...item, condition: e.target.value as any })
                                    }
                                    setIncludedItems(copy)
                                  }}
                                >
                                  <MenuItem value="excellent">Excellent</MenuItem>
                                  <MenuItem value="good">Good</MenuItem>
                                  <MenuItem value="fair">Fair</MenuItem>
                                  <MenuItem value="poor">Poor</MenuItem>
                                  <MenuItem value="missing">Missing</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        </Grid>
                      )
                    })}
                  </Grid>
                </Grid>
              ))}
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
