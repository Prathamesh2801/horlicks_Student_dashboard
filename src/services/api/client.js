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
// Requests go through the same-site proxy path (config.API_PROXY), forwarded to the PHP API by the dev /
// preview server (vite.config.js) or the production web server.
export const API_BASE = config.API_PROXY || config.BASE_URL_SERVER

// No fixed Content-Type: axios sends JSON for objects and multipart (with boundary) for FormData.
// Calls resolve to the server's JSON body (see the response interceptor), hence the `any` type.
/** @type {any} */
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
})

// Full link for a server file path like "uploads/visits/12/abc.jpg" (goes through the dev proxy too).
export const fileUrl = (path) => (path ? `${API_BASE}/${path.replace(/^\//, '')}` : null)

// Send the login token on every request (unless the caller set its own).
api.interceptors.request.use((req) => {
  const token = authStore.get()?.token
  if (token && !req.headers.Authorization) req.headers.Authorization = `Bearer ${token}`
  return req
})

const FIELD_LABELS = {
  username: 'Username',
  full_name: 'Full name',
  password: 'Password',
  role: 'Role',
  status: 'Status',
  visit_date: 'Date',
  city: 'City',
  district: 'District',
  school_name: 'School name',
  latitude: 'Location',
  longitude: 'Location',
  photos: 'Photos',
  normal_photos: 'Normal photos',
  ai_photos: 'Headcount photos',
}

// Turn any failure into an Error with a message that can be shown to the user as-is.
function toError(err) {
  const res = err.response
  let message
  if (!res) {
    message =
      err.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : 'Can’t reach the server. Check your internet connection.'
  } else if (res.status === 413) {
    message = 'The photos are too large to upload together. Remove a few and try again.'
  } else {
    message = res.data?.Message || `Request failed (${res.status})`
  }
  // Validation errors come as { Errors: { password: "Must be 8-72 characters" } }
  const fields = res?.data?.Errors
  if (fields)
    message = Object.entries(fields)
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`)
      .join(' · ')
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
