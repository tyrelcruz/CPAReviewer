import axios from 'axios'

const TOKEN_STORAGE_KEY = 'cpa-reviewer:token'

/** Dispatched on `window` when a request comes back rejected because this
 * device's session has ended server-side (e.g. logged out from another tab)
 * — see AuthContext, which listens for it to clear the session and bounce
 * the user to the login screen. Signing in from another device no longer
 * triggers this — multiple devices can be signed in at once. */
export const SESSION_ENDED_EVENT = 'auth:session-ended'

export const apiClient = axios.create({
  // `||` (not `??`) on purpose — an empty string from a misconfigured .env
  // must fall back too, not resolve to a same-origin relative baseURL.
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data?.code === 'SESSION_ENDED') {
      clearStoredToken()
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
