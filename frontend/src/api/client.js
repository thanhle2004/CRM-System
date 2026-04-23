import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let refreshPromise = null

// Attach JWT if stored
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    const message = err.response?.data?.message

    if (
      err.response?.status === 401 &&
      message === 'Token expired' &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/auth/refresh')
          .then((response) => {
            const accessToken = response.data?.data?.accessToken
            if (accessToken) {
              localStorage.setItem('crm_token', accessToken)
            }
            return accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const newAccessToken = await refreshPromise
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return client(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('crm_token')
        return Promise.reject(refreshError)
      }
    }

    const msg = err.response?.data?.message || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export default client
