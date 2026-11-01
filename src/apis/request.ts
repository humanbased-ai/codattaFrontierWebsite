import { appStoreActions } from '@/stores/app.store'
import { authRedirect } from '@/utils/auth'
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import cookies from 'js-cookie'

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  // location.hash is used for local development to mock app container
  const userAgent = navigator.userAgent.toLowerCase()
  const isApp = userAgent.includes('codatta') || location.hash?.toLowerCase().includes('codatta')
  const token = cookies.get('auth') || localStorage.getItem('auth')

  // Detect device type based on user agent
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

  if (token) config.headers['token'] = `${token}`
  config.headers['channel'] = isApp ? 'codatta-ios-app' : 'codatta-platform-website'
  config.headers['device'] = isMobileDevice ? 'mobile' : 'web'

  return config
}

function baseResponseInterceptor(res: AxiosResponse) {
  const isResTypeA = Object.getOwnPropertyNames(res.data).includes('code')
  const isResTypeB = Object.getOwnPropertyNames(res.data).includes('success')

  if (isResTypeA && res.data?.code !== '000000') {
    const error = new AxiosError(res.data?.message, res.data?.code, res.config, res.request, res)
    return Promise.reject(error)
  }

  if (isResTypeB && res.data?.success !== true) {
    if (res.data.errorCode === 6019) {
      appStoreActions.openModal({
        type: 'error',
        title: 'Submission Restricted',
        content:
          'Our system has detected a violation of the data submission policy. Your data submission access has been suspended for 14 days.Please review the rules carefully before your next submission. \n For assistance or to appeal, please contact us at \n support@codatta.io.'
      })

      const error = new AxiosError('Submission Restricted', res.data?.errorCode, res.config, res.request, res)
      return Promise.reject(error)
    }

    const error = new AxiosError(res.data?.errorMessage, res.data?.errorCode, res.config, res.request, res)
    return Promise.reject(error)
  }

  return res
}

function errorResponseInterceptor(err: AxiosError) {
  if ((err.response?.status ?? err.status) === 401) {
    const url = authRedirect()
    if (window.location.pathname !== '/account/signin') window.location.href = url
  }
  return Promise.reject(err)
}

request.interceptors.request.use(authRequestInterceptor)
request.interceptors.response.use(baseResponseInterceptor, errorResponseInterceptor)

export default request

export interface Response<T> {
  data: T
  success: true
  errorCode: 0
  errorMessage: string
}

export interface PaginationParam {
  page: number
  page_size: number
}

export interface PaginationResponse<T> extends Response<T> {
  data: T
  total_count: number
  total_page: number
  page: number
}

export interface DataPaginationRes<T> {
  data: {
    page_num: number
    page_size: number
    count: number
    list: T[]
  }
  code: string
  message: string
}

export interface TPagination {
  page_size: number
  page_num: number
}
