const routes = {
  getContracts: '/api/contracts',
  generateContract: '/api/contract/generate/:bookingId',
  getContractByBooking: '/api/contract/booking/:bookingId',
  downloadContract: '/api/contract/download/:bookingId',
  deleteContract: '/api/contract/:id',
}

export default routes
