import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Paper
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings as rpStrings } from '@/lang/reset-password'
import { useUserContext, UserContextType } from '@/context/UserContext'
import * as helper from '@/utils/helper'
import Error from './Error'
import NoMatch from './NoMatch'
import { schema, FormFields } from '@/models/ResetPasswordForm'
import PasswordInput from '@/components/PasswordInput'
import OtpDialog from '@/components/OtpDialog'

import '@/assets/css/reset-password.css'

const ResetPassword = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<bookcarsTypes.User | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, setError, clearErrors } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const onSubmit = async ({ password }: FormFields) => {
    try {
      const data: bookcarsTypes.ActivatePayload = { userId, token, password }

      const status = await UserService.activate(data)

      if (status === 200) {
        const signInResult = await UserService.signin({ email, password })

        if (signInResult.status === 200) {
          const user = await UserService.getUser(signInResult.data._id)
          setIsAuthenticated(true)
          setUser(user)
          setUserLoaded(true)

          const _status = await UserService.deleteTokens(userId)

          if (_status === 200) {
            navigate('/')
          } else {
            helper.error()
          }
        } else if (signInResult.status === 202) {
          // OTP verification required - show OTP dialog
          const userData = (signInResult.data as any).user || signInResult.data
          setPendingUser(userData)
          setOtpDialogOpen(true)
        } else {
          helper.error()
        }
      } else {
        helper.error()
      }
    } catch (err) {
      console.error('Password reset error:', err)
      helper.error(err)
    }
  }

  const handleOtpSuccess = async (user: bookcarsTypes.User) => {
    try {
      setIsNavigating(true)
      setUser(user)
      // Navigate directly to dashboard - page content hidden
      navigate('/')
    } catch (err) {
      console.error('OTP success error:', err)
      setOtpDialogOpen(false)
      helper.error(err)
    }
  }

  const handleOtpCancel = () => {
    setOtpDialogOpen(false)
    setPendingUser(null)
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    // Allow password reset even if logged in, but check if it's for the same user
    const params = new URLSearchParams(window.location.search)
    if (params.has('u') && params.has('e') && params.has('t')) {
      const _userId = params.get('u')
      const _email = params.get('e')
      const _token = params.get('t')
      
      // If user is logged in and trying to reset their own password, show no match
      if (user && user._id === _userId) {
        setNoMatch(true)
        return
      }
      
      if (_userId && _email && _token) {
        try {
          const status = await UserService.checkToken(_userId, _email, _token)

          if (status === 200) {
            setUserId(_userId)
            setEmail(_email)
            setToken(_token)
            setVisible(true)
          } else {
            setNoMatch(true)
          }
        } catch (err) {
          console.error(err)
          setError('root', {})
        }
      } else {
        setNoMatch(true)
      }
    } else {
      setNoMatch(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      {!isNavigating && (
        <div className="reset-password">
          {visible && (
            <div className="reset-password-container">
              <Paper elevation={10} className="reset-password-form">
                <h1>{rpStrings.RESET_PASSWORD_HEADING}</h1>
                <form onSubmit={handleSubmit(onSubmit)}>

                  <PasswordInput
                    label={commonStrings.PASSWORD}
                    variant="standard"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    onChange={(e) => {
                      if (errors.password) {
                        clearErrors('password')
                      }
                      setValue('password', e.target.value)
                    }}
                    required
                    autoComplete="new-password"
                  />

                  <PasswordInput
                    label={commonStrings.CONFIRM_PASSWORD}
                    variant="standard"
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    onChange={(e) => {
                      if (errors.confirmPassword) {
                        clearErrors('confirmPassword')
                      }
                      setValue('confirmPassword', e.target.value)
                    }}
                    required
                    inputProps={{
                      autoComplete: 'new-password',
                      form: {
                        autoComplete: 'off',
                      },
                    }}
                  />

                  <div className="buttons">
                    <Button type="submit" className="btn-primary btn-margin btn-margin-bottom" variant="contained" disabled={isSubmitting}>
                      {commonStrings.SAVE}
                    </Button>
                    <Button variant="outlined" color="primary" className="btn-margin-bottom" onClick={() => navigate('/')}>
                      {commonStrings.CANCEL}
                    </Button>
                  </div>
                </form>
              </Paper>
            </div>
          )}

          {errors.root && <Error />}

          {!isAuthenticated && noMatch && <NoMatch hideHeader />}
        </div>
      )}

      {pendingUser && (
        <OtpDialog
          open={otpDialogOpen}
          userId={pendingUser._id!}
          email={pendingUser.email!}
          language={pendingUser.language}
          stayConnected={false}
          onSuccess={handleOtpSuccess}
          onCancel={handleOtpCancel}
        />
      )}
    </Layout>
  )
}

export default ResetPassword
