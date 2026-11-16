import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router'
import { MdDashboard, MdFormatListBulleted, MdInstallDesktop, MdLogout, MdMap, MdMenu, MdPerson } from 'react-icons/md'
import Logo from '../components/common/Logo'
import { Avatar } from '../components/ui'
import { useAuth } from '../features/auth'
import { installActions, useInstall } from '../features/pwa'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: MdDashboard, end: true },
  { to: '/admin/visits', label: 'Visits', icon: MdFormatListBulleted },
  { to: '/admin/map', label: 'Map', icon: MdMap },
  { to: '/admin/users', label: 'Users', icon: MdPerson },
]

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth()
  const { canInstall } = useInstall()
  return (
    <div className="flex h-full flex-col bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <Logo className="h-11 w-auto" />
        <p className="mt-3 font-bold text-brand-700">School Activity</p>
        <p className="text-xs text-gray-500">Admin dashboard</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-brand-100 font-semibold text-brand-700 before:absolute before:-left-4 before:inset-y-1 before:w-1 before:rounded-r before:bg-accent-600'
                  : 'font-medium text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="size-5" /> {label}
          </NavLink>
        ))}
      </nav>
      {canInstall && (
        <button
          onClick={() => {
            onNavigate?.()
            installActions.open()
          }}
          className="mt-auto mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
        >
          <MdInstallDesktop className="size-5" /> Install app
        </button>
      )}
      <div className={`${canInstall ? '' : 'mt-auto'} flex items-center gap-3 rounded-xl bg-page p-3`}>
        <Avatar name={user.name} className="bg-sun-400 text-brand-900" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-gray-500">Admin</p>
        </div>
        <button onClick={logout} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-200" aria-label="Log out" title="Log out">
          <MdLogout className="size-5" />
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-[1100] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMenuOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[1000] flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <button className="-ml-1 rounded-lg p-1.5 hover:bg-gray-100" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <MdMenu className="size-6" />
        </button>
        <Logo className="h-8 w-auto" />
        <span className="text-sm font-bold text-brand-700">School Activity</span>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
