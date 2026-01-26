import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'

import '@/assets/css/driver-license.css'

interface DriverContractProps {
  user?: bookcarsTypes.User
  variant?: 'standard' | 'outlined'
  className?: string
  onUpload?: (filename: string) => void
  onDelete?: () => void
}

const DriverContract = ({
  user,
  variant = 'standard',
  className,
  onUpload,
  onDelete,
}: DriverContractProps) => {
  const [driverContract, setDriverContract] = useState(user?.driverContract || null)

  const handleClick = async () => {
    const upload = document.getElementById('upload-driver-contract') as HTMLInputElement
    if (upload) {
      upload.value = ''
      setTimeout(() => {
        upload.click()
      }, 0)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      helper.error()
      return
    }

    const reader = new FileReader()
    const file = e.target.files[0]

    reader.onloadend = async () => {
      try {
        let filename: string | null = null
        if (user) {
          // upload new file
          const res = await UserService.updateDriverContract(user._id!, file)
          if (res.status === 200) {
            filename = res.data
          } else {
            helper.error()
          }
        } else {
          // Remove previous temp file
          if (driverContract) {
            await UserService.deleteTempDriverContract(driverContract)
          }
          // upload new file
          filename = await UserService.createDriverContract(file)
        }

        if (filename) {
          if (onUpload) {
            onUpload(filename)
          }
        }

        setDriverContract(filename)
      } catch (err) {
        helper.error(err)
      }
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className={`driver-license ${className || ''}`}>
      {variant === 'standard' ? (
        <Input
          value={driverContract || commonStrings.UPLOAD_CONTRACT}
          readOnly
          onClick={handleClick}
          className="filename"
        />
      ) : (
        <OutlinedInput
          value={driverContract || commonStrings.UPLOAD_CONTRACT}
          readOnly
          onClick={handleClick}
          className="filename"
        />
      )}
      <div className="actions">
        <IconButton
          size="small"
          onClick={handleClick}
        >
          <UploadIcon className="icon" />
        </IconButton>

        {driverContract && (
          <>
            <IconButton
              size="small"
              onClick={() => {
                const url = `${bookcarsHelper.trimEnd(user ? env.CDN_CONTRACTS : env.CDN_TEMP_CONTRACTS, '/')}/${driverContract}`
                helper.downloadURI(url)
              }}
            >
              <ViewIcon className="icon" />
            </IconButton>
            <IconButton
              size="small"
              onClick={async () => {
                try {
                  let status = 0
                  if (user) {
                    status = await UserService.deleteDriverContract(user._id!)
                  } else {
                    status = await UserService.deleteTempDriverContract(driverContract!)
                  }

                  if (status === 200) {
                    setDriverContract(null)

                    if (onDelete) {
                      onDelete()
                    }
                  } else {
                    helper.error()
                  }
                } catch (err) {
                  helper.error(err)
                }
              }}
            >
              <DeleteIcon className="icon" />
            </IconButton>
          </>
        )}
      </div>
      <input id="upload-driver-contract" type="file" accept="image/*" hidden onChange={handleChange} />
    </div>
  )
}

export default DriverContract
