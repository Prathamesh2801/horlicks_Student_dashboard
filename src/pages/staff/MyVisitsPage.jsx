import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MdAdd, MdAssignment, MdCloudOff, MdCloudUpload, MdInstallMobile, MdLogout } from 'react-icons/md'
import Logo from '../../components/common/Logo'
import { Button, EmptyState, Spinner } from '../../components/ui'
import { config } from '../../config/config'
import { useAuth } from '../../features/auth'
import { installActions, useInstall } from '../../features/pwa'
import { useDrafts, VisitCard } from '../../features/visits'
import { listVisits } from '../../services/api/visits.service'
import { uploadEvents, uploadQueued } from '../../services/drafts/uploadQueue'
import { formatNumber, monthISO } from '../../utils/format'

const RECENT = 5

// A draft shown with the same card as an uploaded visit.
const draftAsVisit = (d) => ({
  ...d,
  cityName: d.city,
  status: d.state,
  photoCount: d.photos.length,
  headcount: null,
})

export default function MyVisitsPage() {
  const { user, logout } = useAuth()
  const { canInstall } = useInstall()
  const drafts = useDrafts(user.username)
  const [visits, setVisits] = useState(null) // uploaded visits (server)
  const [month, setMonth] = useState(null) // { visits, students } this month
  const [loadError, setLoadError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [uploading, setUploading] = useState(false)

  const reload = useCallback(
    () =>
      listVisits().then(
        (all) => {
          const thisMonth = all.filter((v) => v.date.startsWith(monthISO()))
          setVisits(all)
          setMonth({ visits: thisMonth.length, students: thisMonth.reduce((s, v) => s + (v.headcount ?? 0), 0) })
          setLoadError(null)
        },
        (err) => setLoadError(err.message),
      ),
    [],
  )

  useEffect(() => {
    reload()
    // A queued visit finished uploading in the background, or the phone is back online: refresh.
    uploadEvents.addEventListener('uploaded', reload)
    window.addEventListener('online', reload)
    return () => {
      uploadEvents.removeEventListener('uploaded', reload)
      window.removeEventListener('online', reload)
    }
  }, [reload])

  const waiting = drafts?.filter((d) => d.state === 'queued').length ?? 0
  const shown = showAll ? visits : visits?.slice(0, RECENT)

  const uploadNow = async () => {
    setUploading(true)
    await uploadQueued().catch(() => {})
    setUploading(false)
  }

  return (
    <>
      <header className="sticky top-0 z-[900] -mx-4 mb-4 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Logo className="h-11 w-auto rounded" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-700">{config.appName}</p>
          <p className="truncate text-xs text-gray-500">{user.name} · Ground Team</p>
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
            {waiting > 0 && (
              <span className="rounded-full bg-sun-400 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
                {waiting} waiting to upload
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold">{month ? formatNumber(month.visits) : '—'}</p>
              <p className="text-xs text-white/80">Visits uploaded</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{month ? formatNumber(month.students) : '—'}</p>
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

      {drafts?.length > 0 && (
        <section className="mt-6">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="font-bold">On this phone</h2>
            {waiting > 0 && (
              <Button variant="secondary" size="sm" onClick={uploadNow} loading={uploading}>
                <MdCloudUpload className="size-4" /> Upload now
              </Button>
            )}
          </div>
          <p className="mb-2 text-xs text-gray-500">
            Drafts, and visits waiting for internet. Waiting visits upload by themselves when you’re online with the app open.
          </p>
          <div className="space-y-3">
            {drafts.map((d) => (
              <VisitCard key={d.id} visit={draftAsVisit(d)} to={`/staff/drafts/${d.id}`} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="font-bold">{showAll ? 'All uploaded visits' : 'Uploaded visits'}</h2>
        {visits?.length > RECENT && (
          <button onClick={() => setShowAll((s) => !s)} className="text-sm font-semibold text-brand-700">
            {showAll ? 'Show less' : 'View all'}
          </button>
        )}
      </div>

      {loadError && !visits ? (
        <EmptyState
          icon={MdCloudOff}
          title="Can’t load uploaded visits"
          text={`${loadError} Drafts on this phone are safe.`}
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : !visits ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : visits.length === 0 ? (
        <EmptyState icon={MdAssignment} title="No uploaded visits yet" text="Tap “Start new visit” when you reach a school." />
      ) : (
        <div className="space-y-3">
          {shown.map((v) => (
            <VisitCard key={v.id} visit={v} to={`/staff/visits/${v.id}`} />
          ))}
        </div>
      )}
    </>
  )
}
