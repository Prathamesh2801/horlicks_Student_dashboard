import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MdAdd, MdAssignment, MdInstallMobile, MdLogout } from 'react-icons/md'
import Logo from '../../components/common/Logo'
import { EmptyState, Spinner } from '../../components/ui'
import { config } from '../../config/config'
import { useAuth } from '../../features/auth'
import { installActions, useInstall } from '../../features/pwa'
import { VisitCard } from '../../features/visits'
import { listVisits } from '../../services/api/visits.service'
import { formatNumber, monthISO } from '../../utils/format'

const RECENT = 5

export default function MyVisitsPage() {
  const { user, logout } = useAuth()
  const { canInstall } = useInstall()
  const [visits, setVisits] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const reload = useCallback(() => listVisits({ mine: 1 }).then(setVisits), [])
  useEffect(() => {
    reload()
  }, [reload])

  // Refresh while the AI is counting so the numbers update by themselves.
  const counting = visits?.filter((v) => v.status === 'processing').length ?? 0
  useEffect(() => {
    if (!counting) return
    const timer = setInterval(reload, 3000)
    return () => clearInterval(timer)
  }, [counting, reload])

  const month = monthISO()
  const thisMonth = (visits ?? []).filter((v) => v.date.startsWith(month) && v.status !== 'draft')
  const students = thisMonth.reduce((s, v) => s + (v.headcount ?? 0), 0)
  const shown = showAll ? visits : visits?.slice(0, RECENT)

  return (
    <>
      <header className="sticky top-0 z-[900] -mx-4 mb-4 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Logo className="h-9 w-auto" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-700">{config.appName}</p>
          <p className="truncate text-xs text-gray-500">{user.name} · Staff</p>
        </div>
        {canInstall && (
          <button
            onClick={installActions.open}
            className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
            aria-label="Install app"
            title="Install app"
          >
            <MdInstallMobile className="size-5" />
          </button>
        )}
        <button onClick={logout} className="rounded-lg p-2 text-gray-700 hover:bg-gray-100" aria-label="Log out" title="Log out">
          <MdLogout className="size-5" />
        </button>
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-brand-700 p-5 text-white">
        <div className="absolute -bottom-16 -right-10 size-44 rounded-full bg-brand-900/70" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/85">This month</p>
            {counting > 0 && (
              <span className="rounded-full bg-sun-400 px-2.5 py-0.5 text-xs font-semibold text-brand-900">{counting} counting</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold">{visits ? thisMonth.length : '—'}</p>
              <p className="text-xs text-white/80">Visits done</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{visits ? formatNumber(students) : '—'}</p>
              <p className="text-xs text-white/80">Students counted</p>
            </div>
          </div>
        </div>
      </section>

      <Link
        to="/staff/visits/new"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-accent-700 active:scale-[0.98]"
      >
        <MdAdd className="size-6" /> Start new visit
      </Link>

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="font-bold">{showAll ? 'All visits' : 'Recent visits'}</h2>
        {visits?.length > RECENT && (
          <button onClick={() => setShowAll((s) => !s)} className="text-sm font-semibold text-brand-700">
            {showAll ? 'Show less' : 'View all'}
          </button>
        )}
      </div>

      {!visits ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : visits.length === 0 ? (
        <EmptyState icon={MdAssignment} title="No visits yet" text="Tap “Start new visit” when you reach a school." />
      ) : (
        <div className="space-y-3">
          {shown.map((v) => (
            <VisitCard key={v.id} visit={v} to={v.status === 'draft' ? `/staff/visits/${v.id}/photos` : `/staff/visits/${v.id}`} />
          ))}
        </div>
      )}
    </>
  )
}
