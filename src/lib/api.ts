/**
 * Axios HTTP client with JWT authentication interceptor.
 * Automatically attaches Bearer token to requests and handles 401 responses.
 *
 * @author StockOps Team
 * @since 1.0
 */

import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

/**
 * Axios instance configured for StockOps API.
 * Base URL is configurable via VITE_API_BASE_URL environment variable.
 */
const api = axios.create({
  // Use relative path so nginx proxy handles API requests
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor that attaches JWT token to Authorization header.
 * Retrieves token from Zustand auth store.
 * Excludes login endpoint from adding Authorization header.
 */
api.interceptors.request.use((config) => {
  // Don't add Authorization header to login endpoint
  if (config.url === '/api/v1/auth/login') {
    return config
  }
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response interceptor that handles authentication errors.
 * On 401 Unauthorized, clears auth state and redirects to login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api