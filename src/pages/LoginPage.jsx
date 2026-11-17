import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate, useNavigate } from 'react-router'
import { MdInstallMobile, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import Logo from '../components/common/Logo'
import { Button, Card, Input } from '../components/ui'
import { config } from '../config/config'
import { homePathFor, useAuth } from '../features/auth'
import { installActions, useInstall } from '../features/pwa'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { canInstall } = useInstall()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative min-h-dvh overflow-hidden bg-cream">
      <div className="absolute inset-x-0 top-0 h-[24rem] overflow-hidden bg-brand-700 sm:h-[26rem]">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-900" />
        <div className="absolute -bottom-20 -left-24 size-56 rounded-full bg-accent-600" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full max-w-sm flex-col px-5 pt-14 pb-8 sm:pt-20"
      >
        <div className="text-center text-white">
          <Logo variant="white" className="mx-auto mb-5 h-20 w-auto drop-shadow-sm" />
          <h1 className="text-3xl font-bold tracking-tight">{config.appName}</h1>
          <p className="mt-1 text-sm text-white/85">School activity app</p>
        </div>

        <Card className="mt-10 p-6 shadow-xl">
          <h2 className="text-xl font-bold">Sign in</h2>
          <p className="mb-5 text-sm text-gray-500">Use the username and password from your admin.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              placeholder="e.g. EMP001"
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <MdVisibilityOff className="size-5" /> : <MdVisibility className="size-5" />}
                </button>
              }
            />
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-600">
          <MdLock className="size-4" /> Accounts are created by your admin
        </p>
        {canInstall && (
          <button
            type="button"
            onClick={installActions.open}
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-gray-200 hover:bg-brand-50"
          >
            <MdInstallMobile className="size-5" /> Install the app
          </button>
        )}
      </motion.div>
    </div>
  )
}
