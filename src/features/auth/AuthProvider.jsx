import { useMemo, useState } from 'react'
import { login as apiLogin } from '../../services/api/auth'
import { authStore } from '../../services/api/client'
import { AuthContext } from './useAuth'

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => authStore.get())

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      async login(username, password) {
        const res = await apiLogin({ username, password })
        authStore.set(res)
        setAuth(res)
        return res.user
      },
      logout() {
        authStore.clear()
        // Drop API responses cached for offline use, so the next user on this device can't see them.
        if ('caches' in window) caches.delete('api').catch(() => {})
        setAuth(null)
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
