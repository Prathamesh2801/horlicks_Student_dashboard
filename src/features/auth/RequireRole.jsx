import { Navigate } from 'react-router'
import { homePathFor, useAuth } from './useAuth'

export default function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />
  return children
}
