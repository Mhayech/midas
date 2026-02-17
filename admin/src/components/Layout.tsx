import React, { useState, useEffect, useRef, CSSProperties, ReactNode } from 'react'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/master'
import * as UserService from '@/services/UserService'
import Unauthorized from './Unauthorized'
import * as helper from '@/utils/helper'
import { useUserContext, UserContextType } from '@/context/UserContext'

interface LayoutProps {
  strict?: boolean
  admin?: boolean
  style?: CSSProperties
  children: ReactNode
  onLoad?: (user?: bookcarsTypes.User) => void
}

const Layout = ({
  strict,
  admin,
  style,
  children,
  onLoad
}: LayoutProps) => {
  const context = useUserContext() as UserContextType | null
  const [loading, setLoading] = useState(true)
  const onLoadCalled = useRef(false)

  useEffect(() => {
    if (!context) {
      return
    }

    const currentUser = UserService.getCurrentUser()

    if (!currentUser && strict) {
      UserService.signout(true)
    } else if (context.userLoaded) {
      // Check admin requirement before loading completes
      if (admin && context.user && context.user.type !== bookcarsTypes.RecordType.Admin) {
        context.setUnauthorized(true)
        return
      }

      setLoading(false)

      // Only call onLoad once per mount
      if (onLoad && !onLoadCalled.current) {
        onLoadCalled.current = true
        onLoad(context.user || undefined)
      }
    }
  }, [context?.userLoaded, context?.user, strict, admin]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset onLoadCalled when component unmounts/remounts
  useEffect(() => {
    return () => {
      onLoadCalled.current = false
    }
  }, [])

  if (!context) {
    return null // Context not available yet
  }

  const { user, userLoaded, unauthorized } = context

  const handleResend = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    try {
      if (user) {
        const data = { email: user.email }

        const status = await UserService.resendLink(data)
        if (status === 200) {
          helper.info(strings.VALIDATION_EMAIL_SENT)
        } else {
          helper.error(null, strings.VALIDATION_EMAIL_ERROR)
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err, strings.VALIDATION_EMAIL_ERROR)
    }
  }

  return (
    <>
      {((!user && !loading) || (user) || !strict) && !unauthorized ? (
        <div className="content" style={style || {}}>
          {userLoaded && !loading && children}
        </div>
      ) : (
        !loading && !unauthorized && (
          <div className="validate-email">
            <span>{strings.VALIDATE_EMAIL}</span>
            <Button type="button" variant="contained" size="small" className="btn-primary btn-resend" onClick={handleResend}>
              {strings.RESEND}
            </Button>
          </div>
        )
      )}
      {unauthorized && <Unauthorized />}
    </>
  )
}

export default Layout
