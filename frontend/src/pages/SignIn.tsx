import React, { useState } from 'react'
import {
  Paper,
  FormControl,
  InputLabel,
  Input,
  Button,
  FormHelperText,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings as suStrings } from '@/lang/sign-up'
import { strings } from '@/lang/sign-in'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Error from '@/components/Error'
import OtpDialog from '@/components/OtpDialog'
import Layout from '@/components/Layout'
import SocialLogin from '@/components/SocialLogin'
import Footer from '@/components/Footer'
import { schema, FormFields } from '@/models/SignInForm'
import PasswordInput from '@/components/PasswordInput'

import '@/assets/css/signin.css'

const SignIn = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [visible, setVisible] = useState(false)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<bookcarsTypes.User | null>(null)
  const [pendingStayConnected, setPendingStayConnected] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const signinError = () => {
    setError('root', { message: strings.ERROR_IN_SIGN_IN })
  }

  const onSubmit = async ({ email, password }: FormFields) => {
    try {
      const stayConnected = UserService.getStayConnected()
      const data: bookcarsTypes.SignInPayload = {
        email,
        password,
        stayConnected
      }

      const res = await UserService.signin(data)

      // Status 202 means OTP verification is required
      if (res.status === 202) {
        // Backend returns { otpRequired: true, user: {...} }
        const userData = (res.data as any).user || res.data
        setPendingUser(userData)
        setPendingStayConnected(stayConnected)
        setOtpDialogOpen(true)
        return
      }

      if (res.status === 200) {
        if (res.data.blacklisted) {
          await UserService.signout(false)
          setError('root', { message: strings.IS_BLACKLISTED })
        } else {
          const user = await UserService.getUser(res.data._id)
          setUser(user)
          setUserLoaded(true)
        }
      } else {
        signinError()
      }
    } catch {
      signinError()
    }
  }

  const handleOtpSuccess = async (user: bookcarsTypes.User) => {
    try {
      setOtpDialogOpen(false)
      setIsRedirecting(true)

      if (user.blacklisted) {
        await UserService.signout(false)
        setError('root', { message: strings.IS_BLACKLISTED })
        setIsRedirecting(false)
        return
      }

      setUser(user)
      setUserLoaded(true)
    } catch (err) {
      console.error('OTP success error:', err)
      setIsRedirecting(false)
      signinError()
    }
  }

  const handleOtpCancel = () => {
    setOtpDialogOpen(false)
    setPendingUser(null)
    setPendingStayConnected(false)
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    UserService.setStayConnected(false)

    if (user) {
      const params = new URLSearchParams(window.location.search)

      if (params.has('from')) {
        const from = params.get('from')
        if (from === 'checkout') {
          navigate('/checkout', {
            state: {
              carId: params.get('c'),
              pickupLocationId: params.get('p'),
              dropOffLocationId: params.get('d'),
              from: new Date(Number(params.get('f'))),
              to: new Date(Number(params.get('t'))),
            }
          })
        } else {
          navigate('/')
        }
      } else {
        navigate('/')
      }
    } else {
      setVisible(true)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>

      {!isRedirecting && (
        <div className="signin">
        <Paper className={`signin-form ${visible ? '' : 'hidden'}`} elevation={10}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <h1 className="signin-form-title">{strings.SIGN_IN_HEADING}</h1>
            <FormControl fullWidth margin="dense" error={!!errors.email}>
              <InputLabel>{commonStrings.EMAIL}</InputLabel>
              <Input
                {...register('email')}
                onChange={(e) => {
                  if (errors.email) {
                    clearErrors('email')
                  }
                  // Without the next line, if the field is auto-filled by the browser, react-form does not know it
                  setValue('email', e.target.value)
                }}
                autoComplete="email"
                required
              />
              <FormHelperText error={!!errors.email}>{errors.email?.message || ''}</FormHelperText>
            </FormControl>

            <PasswordInput
              label={commonStrings.PASSWORD}
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
              autoComplete="password"
            />

            <div className="stay-connected">
              <input
                id="stay-connected"
                type="checkbox"
                onChange={(e) => UserService.setStayConnected(e.currentTarget.checked)}
              />
              <label
                htmlFor="stay-connected"
              >
                {strings.STAY_CONNECTED}
              </label>
            </div>

            <div className="forgot-password-wrapper">
              <Button variant="text" onClick={() => navigate('/forgot-password')} className="btn-lnk">{strings.RESET_PASSWORD}</Button>
            </div>

            <div className="social-login">
              <SocialLogin />
            </div>

            <div className="signin-buttons">
              <Button variant="outlined" color="primary" onClick={() => navigate('/sign-up')} className="btn-margin btn-margin-bottom">
                {suStrings.SIGN_UP}
              </Button>
              <Button type="submit" variant="contained" className="btn-primary btn-margin btn-margin-bottom" disabled={isSubmitting}>
                {strings.SIGN_IN}
              </Button>
            </div>
            <div className="form-error">
              {errors.root && <Error message={errors.root.message!} />}
            </div>
          </form>
        </Paper>
      </div>
      )}

      {pendingUser && (
        <OtpDialog
          open={otpDialogOpen}
          userId={pendingUser._id!}
          email={pendingUser.email!}
          language={pendingUser.language}
          stayConnected={pendingStayConnected}
          onSuccess={handleOtpSuccess}
          onCancel={handleOtpCancel}
        />
      )}

      <Footer />

    </Layout>
  )
}

export default SignIn
