import { useMemo, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from '../../services/api/auth.service'
import { authStore } from '../../services/api/client'
import { AuthContext } from './useAuth'

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => authStore.get())

  const value = useMemo(
    () => ({
      user: auth?.user ?? null, // { username, name, role: 'admin' | 'staff' | 'client' }
      async login(username, password) {
        const session = await apiLogin({ username, password })
        authStore.set(session)
        setAuth(session)
        return session.user
      },
      logout() {
        // End the session on the server too; sign out locally even if the server can't be reached.
        if (auth?.token) apiLogout(auth.token).catch(() => {})
        authStore.clear()
        // Drop API responses cached for offline use, so the next user on this device can't see them.
        // (Drafts on the phone are kept: they belong to the user and upload after their next login.)
        if ('caches' in window) for (const name of ['api', 'visit-photos']) caches.delete(name).catch(() => {})
        setAuth(null)
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
