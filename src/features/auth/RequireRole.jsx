import { Navigate } from 'react-router'
import { homePathFor, useAuth } from './useAuth'

// role: one role or a list (e.g. ['client', 'admin'] so admins can preview the client view)
export default function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (![role].flat().includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />
  return children
}
