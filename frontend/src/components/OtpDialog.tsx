import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Close as CloseIcon, Security as SecurityIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/sign-in'
import * as UserService from '@/services/UserService'

interface OtpDialogProps {
  open: boolean
  userId: string
  email: string
  language?: string
  stayConnected: boolean
  onSuccess: (user: bookcarsTypes.User) => void
  onCancel: () => void
}

const OtpDialog = ({ open, userId, email, language, stayConnected, onSuccess, onCancel }: OtpDialogProps) => {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError(strings.OTP_ERROR)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await UserService.verifyOtp({
        userId,
        otp,
      })

      if (result.success) {
        // Complete signin after successful OTP verification
        const signinResult = await UserService.signinComplete({
          userId,
          stayConnected,
        })
        // Pass the user data to the success handler
        onSuccess(signinResult.data)
      } else {
        // Handle specific error messages
        if (result.message === 'MAX_ATTEMPTS_EXCEEDED') {
          setError(strings.OTP_MAX_ATTEMPTS)
        } else if (result.message === 'OTP_NOT_FOUND') {
          setError(strings.OTP_EXPIRED)
        } else {
          setError(strings.OTP_ERROR)
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError(strings.OTP_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setOtp('')

    try {
      await UserService.resendOtp({
        userId,
        email,
        language,
      })
      setSuccess(strings.OTP_RESENT)
    } catch (err) {
      console.error('OTP resend error:', err)
      setError(strings.OTP_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6 && !loading) {
      handleVerify()
    }
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">{strings.OTP_DIALOG_TITLE}</Typography>
          </Box>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {strings.OTP_DIALOG_MESSAGE}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label={strings.OTP_CODE_LABEL}
          placeholder={strings.OTP_PLACEHOLDER}
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
            setOtp(value)
            setError('')
          }}
          onKeyPress={handleKeyPress}
          autoFocus
          disabled={loading}
          inputProps={{
            maxLength: 6,
            style: { fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' },
          }}
          sx={{ mb: 2 }}
        />

        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <Button
            variant="text"
            onClick={handleResend}
            disabled={loading}
            size="small"
          >
            {strings.OTP_RESEND}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} disabled={loading}>
          {strings.OTP_CANCEL}
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={loading || otp.length !== 6}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {strings.OTP_VERIFY}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default OtpDialog
