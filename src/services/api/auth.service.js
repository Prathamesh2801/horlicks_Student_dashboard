import { api } from './client'

// Server: auth.php (see docs/SERVER_API.md → Login / Logout)
const LOGIN = '/auth.php'
const LOGOUT = '/auth.php?do=logout'

// Server login response → app session
const toSession = (d) => ({
  token: d.Token,
  user: { username: d.Username, name: d.Full_Name, role: d.Role?.toLowerCase() }, // role: 'admin' | 'staff'
})

// Errors: 400 missing field, 401 "Invalid credentials", 429 "Too many login attempts…"
export async function login({ username, password }) {
  const data = await api.post(LOGIN, { username: username.trim(), password }, { skipAuthRedirect: true })
  return toSession(data)
}

// Token passed in because the session is cleared locally straight after this call.
export function logout(token) {
  return api.post(LOGOUT, null, { headers: { Authorization: `Bearer ${token}` }, skipAuthRedirect: true })
}
