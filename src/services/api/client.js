import { config } from '../../config/config'

const AUTH_KEY = 'auth'

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

export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(config.apiUrl + path, location.origin)
  Object.entries(params ?? {}).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))

  const token = authStore.get()?.token
  const isForm = body instanceof FormData
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, { method, headers, body: body && !isForm ? JSON.stringify(body) : body })

  if (res.status === 401 && token) {
    authStore.clear()
    location.hash = '#/login'
    location.reload()
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.blob()
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return data
}
