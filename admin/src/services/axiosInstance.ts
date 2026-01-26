import axios from 'axios'
import env from '@/config/env.config'

const axiosInstance = axios.create({ baseURL: env.API_HOST, withCredentials: true })

export default axiosInstance
