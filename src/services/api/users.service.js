import { api } from './client'

// Server: Admin/user.php, admins only (see docs/SERVER_API.md → Admin · Users)
const USERS = '/Admin/user.php'

const toServerRole = (role) => (role === 'admin' ? 'Admin' : 'Staff')
// "2026-11-17 11:20:05" (server time, IST) → "2026-11-17T11:20:05"
const toDate = (s) => (s ? s.replace(' ', 'T') : null)

// Server user → app user
const toUser = (u) => ({
  username: u.Username,
  name: u.Full_Name,
  role: u.Role?.toLowerCase(), // 'admin' | 'staff'
  active: u.Status === 'Active',
  signedIn: Boolean(u.Has_Session),
  createdAt: toDate(u.Created_AT),
  updatedAt: toDate(u.Updated_AT),
})

// ponytail: one page of up to 200 users; add paging (limit/offset) if there are ever more.
export async function listUsers({ search, role, active } = {}) {
  const params = { limit: 200 }
  if (search) params.search = search
  if (role) params.role = toServerRole(role)
  if (active != null) params.status = active ? 'Active' : 'Inactive'
  const data = await api.get(USERS, { params })
  return data.Data.map(toUser)
}

export async function getUser(username) {
  const data = await api.get(USERS, { params: { username } })
  return toUser(data.Data)
}

// 400 validation (per-field message), 409 "Username already exists"
export async function createUser({ username, name, password, role }) {
  const data = await api.post(USERS, { username, full_name: name, password, role: toServerRole(role) })
  return toUser(data.Data)
}

// Send only what changes: { name, password, role, active }.
// sessionEnded = the user was signed out (password changed or account disabled).
export async function updateUser(username, { name, password, role, active } = {}) {
  const body = { username }
  if (name != null) body.full_name = name
  if (password != null) body.password = password
  if (role != null) body.role = toServerRole(role)
  if (active != null) body.status = active ? 'Active' : 'Inactive'
  const data = await api.put(USERS, body)
  return { user: toUser(data.Data), sessionEnded: Boolean(data.Session_Ended) }
}

export const setUserActive = (username, active) => updateUser(username, { active })
