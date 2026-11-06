import { authRedirect, clearClientAuthentication } from '@/utils/auth'
import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import CryptoJS from 'crypto-js'

export const md5Interceptor = (config: InternalAxiosRequestConfig<unknown>) => {
  const Timestamp = new Date().getTime()
  const salt = 'woshinibaba^***@113'
  // In development, we use relative baseURL '/api' for proxy, but the backend expects the signature
  // to be generated based on the full URL (or at least that's how it was configured before).
  // We prepend the host to match the previous behavior where baseURL was absolute in dev.
  const host = import.meta.env.MODE === 'production' ? '' : 'https://app-test.b18a.io'
  const requestUrl = `${host}${config.baseURL}${config.url}`
  const Signature = CryptoJS.MD5(requestUrl + Timestamp + salt).toString()
  if (!config.headers) config.headers = new AxiosHeaders()
  config.headers['Signature'] = Signature
  config.headers['Timestamp'] = Timestamp
  return config
}

export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (!config.headers) config.headers = new AxiosHeaders()
  config.headers['token'] = localStorage.getItem('token')
  config.headers['uid'] = localStorage.getItem('uid')
  return config
}

export const baseResponseInterceptor = (res: AxiosResponse) => {
  if (res.data.success) {
    return res
  } else {
    if ([1003, 2011].includes(res.data.errorCode)) {
      clearClientAuthentication()

      const url = authRedirect()
      window.location.href = url
    }
    return Promise.reject(new Error(res.data?.errorMessage))
  }
}
