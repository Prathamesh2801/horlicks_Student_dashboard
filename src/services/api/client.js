import axios from 'axios'
import { config } from '../../config/config'

// ---- Login session (token + user) kept in localStorage ----
const AUTH_KEY = 'auth-v2' // v2 = server login; old demo sessions are ignored

export const authStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY))
    } catch {
      return null
    }
  },
  set: (value) => localStorage.setItem(AUTH_KEY, JSON.stringify(value)),
  clear: () => localStorage.removeItem(AUTH_KEY),
}

// ---- One axios instance for the server ----
// In `npm run dev` requests go through Vite's /server-api proxy (vite.config.js), so the app also works
// from a phone over an https tunnel that can't reach the office LAN directly.
export const API_BASE = import.meta.env.DEV ? '/server-api' : config.BASE_URL_SERVER

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

// Send the login token on every request (unless the caller set its own).
api.interceptors.request.use((req) => {
  const token = authStore.get()?.token
  if (token && !req.headers.Authorization) req.headers.Authorization = `Bearer ${token}`
  return req
})

const FIELD_LABELS = { username: 'Username', full_name: 'Full name', password: 'Password', role: 'Role', status: 'Status' }

// Turn any failure into an Error with a message that can be shown to the user as-is.
function toError(err) {
  const res = err.response
  let message
  if (!res) {
    message =
      err.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : 'Can’t reach the server. Check your internet connection.'
  } else {
    message = res.data?.Message || `Request failed (${res.status})`
  }
  // Validation errors come as { Errors: { password: "Must be 8-72 characters" } }
  const fields = res?.data?.Errors
  if (fields) message = Object.entries(fields).map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`).join(' · ')
  const error = new Error(message)
  error.status = res?.status
  error.fields = fields
  return error
}

api.interceptors.response.use(
  (res) => {
    // The server answers { Status: false, Message } for failed actions.
    if (res.data?.Status === false) return Promise.reject(toError({ response: res }))
    return res.data
  },
  (err) => {
    // 401 on a normal request = session ended (logged in elsewhere, disabled or expired): back to login.
    if (err.response?.status === 401 && !err.config?.skipAuthRedirect && authStore.get()) {
      authStore.clear()
      window.location.hash = '#/login'
      window.location.reload()
    }
    return Promise.reject(toError(err))
  },
)
