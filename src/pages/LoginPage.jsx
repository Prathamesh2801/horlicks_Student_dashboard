import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate, useNavigate } from 'react-router'
import { Button, Card, Input } from '../components/ui'
import { config } from '../config/config'
import { homePathFor, useAuth } from '../features/auth'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const u = await login(form.username, form.password)
      navigate(homePathFor(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-50 to-gray-50 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="./icon.svg" alt="" className="mx-auto mb-3 size-14" />
          <h1 className="text-2xl font-semibold">{config.appName}</h1>
          <p className="text-sm text-gray-500">School Activity · Odisha</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" value={form.username} onChange={set('username')} autoComplete="username" autoCapitalize="none" required />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} autoComplete="current-password" required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
        </Card>
        {config.useMock && (
          <p className="mt-4 text-center text-xs text-gray-500">Demo: admin / admin123 · staff / staff123</p>
        )}
      </motion.div>
    </div>
  )
}
