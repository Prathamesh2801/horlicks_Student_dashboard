import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const homePathFor = (role) => ({ admin: '/admin', client: '/client' })[role] ?? '/staff'
