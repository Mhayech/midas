import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Const from '@/config/const'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/cars'
import * as CarService from '@/services/CarService'
import Pager from '@/components/Pager'
import Car from '@/components/Car'
import Progress from '@/components/Progress'

import '@/assets/css/car-list.css'

interface CarListProps {
  from?: Date
  to?: Date
  suppliers?: string[]
  pickupLocation?: string
  dropOffLocation?: string
  pickupLocationName?: string
  carSpecs?: bookcarsTypes.CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[]
  deposit?: number
  cars?: bookcarsTypes.Car[]
  reload?: boolean
  booking?: bookcarsTypes.Booking
  className?: string
  hidePrice?: boolean
  hideSupplier?: boolean
  loading?: boolean
  sizeAuto?: boolean
  ranges?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  distance?: string
  includeAlreadyBookedCars?: boolean
  includeComingSoonCars?: boolean
  onLoad?: bookcarsTypes.DataEvent<bookcarsTypes.Car>
}

const CarList = ({
  from,
  to,
  suppliers,
  pickupLocation,
  dropOffLocation,
  pickupLocationName,
  carSpecs,
  carType: _carType,
  gearbox,
  mileage,
  fuelPolicy,
  deposit,
  cars,
  reload,
  booking,
  className,
  hidePrice,
  hideSupplier,
  loading: carListLoading,
  sizeAuto,
  ranges,
  multimedia,
  rating,
  seats,
  distance,
  includeAlreadyBookedCars,
  includeComingSoonCars,
  onLoad,
}: CarListProps) => {
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [rows, setRows] = useState<bookcarsTypes.Car[]>([])
  const [groupedCars, setGroupedCars] = useState<Map<string, bookcarsTypes.Car[]>>(new Map())
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
      const element = document.querySelector('body')

      if (element) {
        element.onscroll = () => {
          if (fetch
            && !loading
            && window.scrollY > 0
            && window.scrollY + window.innerHeight + env.INFINITE_SCROLL_OFFSET >= document.body.scrollHeight) {
            setLoading(true)
            setPage(page + 1)
          }
        }
      }
    }
  }, [fetch, loading, page])

  const fetchData = async (
    _page: number,
    _suppliers?: string[],
    _pickupLocation?: string,
    _carSpecs?: bookcarsTypes.CarSpecs,
    __carType?: string[],
    _gearbox?: string[],
    _mileage?: string[],
    _fuelPolicy?: string[],
    _deposit?: number,
    _ranges?: string[],
    _multimedia?: string[],
    _rating?: number,
    _seats?: number,
  ) => {
    try {
      setLoading(true)

      const payload: bookcarsTypes.GetCarsPayload = {
        suppliers: _suppliers ?? [],
        pickupLocation: _pickupLocation,
        carSpecs: _carSpecs,
        carType: __carType,
        gearbox: _gearbox,
        mileage: _mileage,
        fuelPolicy: _fuelPolicy,
        deposit: _deposit,
        ranges: _ranges,
        multimedia: _multimedia,
        rating: _rating,
        seats: _seats,
        from,
        to,
        includeAlreadyBookedCars,
        includeComingSoonCars,
      }

      const data = await CarService.getCars(payload, _page, env.CARS_PAGE_SIZE)

      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }
      const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0

      let _rows = []
      if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
        _rows = _page === 1 ? _data.resultData : [...rows, ..._data.resultData]
      } else {
        _rows = _data.resultData
      }

      setRows(_rows)
      setRowCount((_page - 1) * env.CARS_PAGE_SIZE + _rows.length)
      setTotalRecords(_totalRecords)
      setFetch(_data.resultData.length > 0)
      
      // Group cars by name
      const grouped = new Map<string, bookcarsTypes.Car[]>()
      _rows.forEach((car) => {
        if (!grouped.has(car.name)) {
          grouped.set(car.name, [])
        }
        grouped.get(car.name)!.push(car)
      })
      setGroupedCars(grouped)

      if (((env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) && _page === 1) || (env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile)) {
        window.scrollTo(0, 0)
      }

      if (onLoad) {
        onLoad({ rows: _data.resultData, rowCount: _totalRecords })
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      setInit(false)
    }
  }

  useEffect(() => {
    if (suppliers) {
      if (suppliers.length > 0) {
        fetchData(page, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats)
      } else {
        setRows([])
        setFetch(false)
        if (onLoad) {
          onLoad({ rows: [], rowCount: 0 })
        }
        setInit(false)
      }
    }
  }, [page, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cars) {
      setRows(cars)
      setFetch(false)
      
      // Group cars by name
      const grouped = new Map<string, bookcarsTypes.Car[]>()
      cars.forEach((car) => {
        if (!grouped.has(car.name)) {
          grouped.set(car.name, [])
        }
        grouped.get(car.name)!.push(car)
      })
      setGroupedCars(grouped)
      
      if (onLoad) {
        onLoad({ rows: cars, rowCount: cars.length })
      }
      setLoading(false)
    }
  }, [cars]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
  }, [suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats, from, to])

  useEffect(() => {
    if (reload) {
      setPage(1)
      fetchData(1, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats)
    }
  }, [reload, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <section className={`${className ? `${className} ` : ''}car-list`}>
        {rows.length === 0
          ? !init
          && !loading
          && !carListLoading
          && (
            <Card variant="outlined" className="empty-list">
              <CardContent>
                <Typography color="textSecondary">{strings.EMPTY_LIST}</Typography>
              </CardContent>
            </Card>
          )
          : ((from && to && pickupLocation && dropOffLocation) || hidePrice) // || (hidePrice && booking))
          && (
            <>
              {totalRecords > 0 && (
                <div className="title">
                  <div className="bookcars">
                    <span>{strings.TITLE_1}</span>
                    <span className="title-bookcars">{env.WEBSITE_NAME}</span>
                    <span>{strings.TITLE_2}</span>
                  </div>
                  <div className="car-count">
                    {`(${totalRecords} ${totalRecords === 1 ? strings.TITLE_CAR_AVAILABLE : strings.TITLE_CARS_AVAILABLE})`}
                  </div>
                </div>
              )}

              {Array.from(groupedCars.entries()).map(([carName, carGroup]) => {
                // Calculate availability for this group
                const availableUnits = carGroup.filter(c => c.available && !c.fullyBooked && !c.comingSoon).length
                const totalUnits = carGroup.length
                
                // Show the first available car, or first car if none available
                const carToDisplay = carGroup.find(c => c.available && !c.fullyBooked && !c.comingSoon) || carGroup[0]
                
                return (
                  <div key={carName} style={{ position: 'relative' }}>
                    {totalUnits > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        zIndex: 10,
                        background: availableUnits > 0 
                          ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' 
                          : 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        boxShadow: availableUnits > 0 
                          ? '0 2px 8px rgba(76, 175, 80, 0.25)' 
                          : '0 2px 8px rgba(244, 67, 54, 0.25)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                      }}>
                        {availableUnits > 0 && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            animation: 'pulse 2s ease-in-out infinite'
                          }} />
                        )}
                        {availableUnits > 0 
                          ? `${availableUnits}/${totalUnits} ${strings.UNITS_AVAILABLE}` 
                          : strings.ALL_UNITS_UNAVAILABLE}
                      </div>
                    )}
                    <Car
                      key={carToDisplay._id}
                      car={carToDisplay}
                      booking={booking}
                      pickupLocation={pickupLocation}
                      dropOffLocation={dropOffLocation}
                      from={from as Date}
                      to={to as Date}
                      pickupLocationName={pickupLocationName}
                      distance={distance}
                      hideSupplier={hideSupplier}
                      sizeAuto={sizeAuto}
                      hidePrice={hidePrice}
                    />
                  </div>
                )
              })}
            </>
          )}
        {loading && <Progress />}
      </section>
      {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
        <Pager page={page} pageSize={env.CARS_PAGE_SIZE} rowCount={rowCount} totalRecords={totalRecords} onNext={() => setPage(page + 1)} onPrevious={() => setPage(page - 1)} />
      )}
    </>
  )
}

export default CarList
