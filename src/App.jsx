import { RouterProvider } from 'react-router'
import { AuthProvider } from './features/auth'
import { InstallPrompt, PwaStatus } from './features/pwa'
import { router } from './routes'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <InstallPrompt />
      <PwaStatus />
    </AuthProvider>
  )
}
