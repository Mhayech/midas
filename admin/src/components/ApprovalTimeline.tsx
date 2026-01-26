import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
} from '@mui/material'
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Person as CreatedIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { format } from 'date-fns'

interface ApprovalTimelineProps {
  booking: bookcarsTypes.Booking
}

interface TimelineEvent {
  type: 'created' | 'approved' | 'rejected'
  user: bookcarsTypes.User | null
  date: Date
  notes?: string
}

const ApprovalTimeline = ({ booking }: ApprovalTimelineProps) => {
  // Construct timeline events from booking data
  const events: TimelineEvent[] = []

  // Add creation event if createdBy exists
  if (booking.createdBy && typeof booking.createdBy === 'object') {
    events.push({
      type: 'created',
      user: booking.createdBy,
      date: new Date((booking as any).createdAt || Date.now()),
      notes: undefined,
    })
  }

  // Add approval event if exists
  if (booking.approvedBy && booking.approvedAt) {
    events.push({
      type: 'approved',
      user: typeof booking.approvedBy === 'object' ? booking.approvedBy : null,
      date: new Date(booking.approvedAt),
      notes: booking.approvalNotes,
    })
  }

  // Add rejection event if exists
  if (booking.rejectedBy && booking.rejectedAt) {
    events.push({
      type: 'rejected',
      user: typeof booking.rejectedBy === 'object' ? booking.rejectedBy : null,
      date: new Date(booking.rejectedAt),
      notes: booking.approvalNotes,
    })
  }

  // Sort events by date (most recent first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  if (events.length === 0) {
    return null
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <ApprovedIcon />
      case 'rejected':
        return <RejectedIcon />
      case 'created':
        return <CreatedIcon />
      default:
        return null
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'created':
        return 'primary'
      default:
        return 'grey'
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'approved':
        return commonStrings.BOOKING_APPROVED
      case 'rejected':
        return commonStrings.BOOKING_REJECTED
      case 'created':
        return commonStrings.BOOKING_CREATED
      default:
        return ''
    }
  }

  const formatDateTime = (date: Date) => {
    return format(date, 'PPpp') // e.g., "Apr 29, 2024, 9:30 AM"
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return 'Just now'
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    }
    return formatDateTime(date)
  }

  return (
    <Box sx={{ mt: 4, mb: 3 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          fontWeight: 700, 
          color: '#2F5233',
          fontSize: '1.1rem',
          letterSpacing: '-0.02em',
        }}
      >
        {commonStrings.APPROVAL_HISTORY}
      </Typography>
      <Box>
        {events.map((event, index) => {
          const eventColor = 
            event.type === 'approved' ? '#2e7d32' :
            event.type === 'rejected' ? '#d32f2f' :
            '#1976d2'
          
          const eventBgLight =
            event.type === 'approved' ? '#e8f5e9' :
            event.type === 'rejected' ? '#ffebee' :
            '#e3f2fd'

          return (
            <Box
              key={`${event.type}-${event.date.getTime()}`}
              sx={{ position: 'relative', mb: index < events.length - 1 ? 3 : 0 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `2px solid ${eventBgLight}`,
                  bgcolor: 'white',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderColor: eventColor,
                  },
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: event.notes ? 2 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {event.user && (
                      <Avatar
                        src={event.user.avatar}
                        sx={{ 
                          width: 44, 
                          height: 44,
                          bgcolor: eventColor,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {event.user.fullName?.charAt(0)}
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#1a1a1a',
                          mb: 0.25,
                          fontSize: '0.95rem',
                        }}
                      >
                        {event.user?.fullName || 'Unknown User'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: '#666',
                          fontSize: '0.85rem',
                        }}
                      >
                        {event.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip
                      label={getEventLabel(event.type)}
                      size="small"
                      sx={{
                        bgcolor: eventColor,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: '28px',
                        borderRadius: '6px',
                        px: 1,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ 
                        fontSize: '0.75rem',
                        color: '#999',
                        fontWeight: 500,
                      }}
                      title={formatDateTime(event.date)}
                    >
                      {getRelativeTime(event.date)}
                    </Typography>
                  </Box>
                </Box>

                {/* Notes */}
                {event.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        bgcolor: eventBgLight,
                        p: 2,
                        borderRadius: 2,
                        borderLeft: `3px solid ${eventColor}`,
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 700,
                          color: eventColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '0.7rem',
                        }}
                      >
                        {commonStrings.APPROVAL_NOTES}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          color: '#444',
                          lineHeight: 1.6,
                          fontSize: '0.9rem',
                        }}
                      >
                        {event.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default ApprovalTimeline
