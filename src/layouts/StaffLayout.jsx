import { motion } from 'framer-motion'
import { Link, Outlet, useLocation } from 'react-router'
import { MdLogout } from 'react-icons/md'
import { config } from '../config/config'
import { useAuth } from '../features/auth'

export default function StaffLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[900] border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link to="/staff" className="flex-1">
            <p className="font-semibold text-brand-700">{config.appName}</p>
            <p className="text-xs text-gray-500">{user.name}</p>
          </Link>
          <button onClick={logout} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Log out">
            <MdLogout className="size-5" />
          </button>
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-md p-4 pb-24"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
