import React, { useState } from 'react'
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/contracts'
import * as helper from '@/utils/helper'
import * as ContractService from '@/services/ContractService'

import '@/assets/css/contracts.css'

const Contracts = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [contracts, setContracts] = useState<bookcarsTypes.Contract[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [searchText, setSearchText] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedContract, setSelectedContract] = useState<bookcarsTypes.Contract | null>(null)

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      setUser(_user)
      await fetchContracts()
    }
  }

  const fetchContracts = async (page = 0, pageSize = 10, search = '') => {
    try {
      setLoading(true)
      const data = await ContractService.getContracts(page + 1, pageSize, search)
      setContracts(data.rows)
      setRowCount(data.rowCount)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel)
    fetchContracts(newModel.page, newModel.pageSize, searchText)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    fetchContracts(0, paginationModel.pageSize, value)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  const handleDownload = async (contract: bookcarsTypes.Contract) => {
    try {
      const bookingId = typeof contract.booking === 'string' ? contract.booking : contract.booking._id
      if (bookingId) {
        await ContractService.downloadContract(bookingId)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleDelete = (contract: bookcarsTypes.Contract) => {
    setSelectedContract(contract)
    setDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (selectedContract?._id) {
        const status = await ContractService.deleteContract(selectedContract._id)
        if (status === 200) {
          await fetchContracts(paginationModel.page, paginationModel.pageSize, searchText)
          setDeleteDialog(false)
          setSelectedContract(null)
        } else {
          helper.error()
        }
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialog(false)
    setSelectedContract(null)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(user?.language || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns: GridColDef[] = [
    {
      field: 'contractNumber',
      headerName: strings.CONTRACT_NUMBER,
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'customer',
      headerName: strings.CUSTOMER,
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => {
        const customer = row.customer as bookcarsTypes.User
        return customer?.fullName || ''
      },
    },
    {
      field: 'immatriculation',
      headerName: strings.CAR_PLATE,
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => {
        const booking = row.booking as any
        return booking?.car?.immatriculation || ''
      },
    },
    {
      field: 'supplier',
      headerName: commonStrings.SUPPLIER,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => {
        const supplier = row.supplier as bookcarsTypes.User
        return supplier?.fullName || ''
      },
    },
    {
      field: 'generatedAt',
      headerName: strings.GENERATED_AT,
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => formatDate(value as Date),
    },
    {
      field: 'fileSize',
      headerName: strings.FILE_SIZE,
      flex: 0.5,
      minWidth: 90,
      valueGetter: (value) => `${((value as number) / 1024).toFixed(2)} KB`,
    },
    {
      field: 'actions',
      headerName: strings.ACTIONS,
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton
            onClick={() => handleDownload(params.row)}
            color="primary"
            size="small"
            title={strings.DOWNLOAD}
            sx={{
              padding: { xs: '4px', sm: '8px' },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            }}
          >
            <DownloadIcon />
          </IconButton>
          {!helper.accountant(user) && (
            <IconButton
              onClick={() => handleDelete(params.row)}
              color="error"
              size="small"
              title={commonStrings.DELETE}
              sx={{
                padding: { xs: '4px', sm: '8px' },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="contracts">
          <div className="contracts-header">
            <Typography variant="h4" className="contracts-title">
              {strings.CONTRACTS}
            </Typography>
            <TextField
              variant="outlined"
              placeholder={strings.SEARCH_PLACEHOLDER}
              value={searchText}
              onChange={handleSearch}
              size="small"
              className="contracts-search"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <Card className="contracts-card">
            <CardContent>
              <DataGrid
                rows={contracts}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                pageSizeOptions={[10, 25, 50, 100]}
                rowCount={rowCount}
                loading={loading}
                paginationMode="server"
                getRowId={(row) => row._id || ''}
                disableRowSelectionOnClick
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell': {
                    padding: { xs: '8px 4px', sm: '8px' },
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: { xs: '8px 4px', sm: '8px' },
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                  },
                }}
              />
            </CardContent>
          </Card>

          <Dialog open={deleteDialog} onClose={handleCancelDelete}>
            <DialogTitle>{strings.DELETE_CONTRACT}</DialogTitle>
            <DialogContent>
              <Typography>
                {strings.DELETE_CONTRACT_CONFIRM}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDelete} color="inherit">
                {commonStrings.CANCEL}
              </Button>
              <Button onClick={handleConfirmDelete} color="error" variant="contained">
                {commonStrings.DELETE}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
    </Layout>
  )
}

export default Contracts
