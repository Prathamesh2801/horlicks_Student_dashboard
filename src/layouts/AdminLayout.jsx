import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router'
import { MdDashboard, MdDescription, MdListAlt, MdLogout, MdMap, MdMenu, MdPeople } from 'react-icons/md'
import { config } from '../config/config'
import { useAuth } from '../features/auth'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: MdDashboard, end: true },
  { to: '/admin/visits', label: 'Visits', icon: MdListAlt },
  { to: '/admin/map', label: 'Map', icon: MdMap },
  { to: '/admin/users', label: 'Users', icon: MdPeople },
  { to: '/admin/reports', label: 'Reports', icon: MdDescription },
]

function Sidebar({ onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-1 bg-white p-4">
      <p className="mb-6 px-3 text-lg font-semibold text-brand-700">{config.appName}</p>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`
          }
        >
          <Icon className="size-5" /> {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-gray-200 lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-[1100] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-64 shadow-xl"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[900] flex items-center gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <MdMenu className="size-6" />
        </button>
        <div className="flex-1" />
        <div className="text-right text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-gray-500">Admin</p>
        </div>
        <button onClick={logout} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Log out">
          <MdLogout className="size-5" />
        </button>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-7xl p-4 lg:p-6"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
