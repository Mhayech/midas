import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/master'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import { useAnalytics } from '@/utils/useAnalytics'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Unauthorized from '@/components/Unauthorized'

interface LayoutProps {
  strict?: boolean
  children: ReactNode
  onLoad?: (user?: bookcarsTypes.User) => void
}

const Layout = ({
  strict,
  children,
  onLoad
}: LayoutProps) => {
  useAnalytics()

  const context = useUserContext() as UserContextType | null
  const [loading, setLoading] = useState(true)
  const onLoadCalled = useRef(false)

  useEffect(() => {
    if (!context) {
      return
    }

    const currentUser = UserService.getCurrentUser()

    if (!currentUser && strict) {
      UserService.signout(true, false)
    } else if (context.userLoaded) {
      setLoading(false)

      // Only call onLoad once per mount
      if (onLoad && !onLoadCalled.current) {
        onLoadCalled.current = true
        onLoad(context.user || undefined)
      }
    }
  }, [context?.userLoaded, context?.user, strict]) // eslint-disable-line react-hooks/exhaustive-deps

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
      }
    } catch (err) {
      helper.error(err, strings.VALIDATION_EMAIL_ERROR)
    }
  }

  return (
    <>
      {
        !(unauthorized && strict) && (
          (!user && !loading) || (user) || !strict ? (
            <div className="content">{children}</div>
          ) : (
            !loading && (
              <div className="validate-email">
                <span>{strings.VALIDATE_EMAIL}</span>
                <Button type="button" variant="contained" className="btn-primary btn-resend" onClick={handleResend}>
                  {strings.RESEND}
                </Button>
              </div>
            )
          )
        )
      }
      {unauthorized && strict && <Unauthorized />}
    </>
  )
}

export default Layout
