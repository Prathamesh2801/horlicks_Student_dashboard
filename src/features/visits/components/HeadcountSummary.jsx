import { MdGroups } from 'react-icons/md'
import { formatNumber } from '../../../utils/format'
import VisitStatusBadge from './VisitStatusBadge'

// Navy hero card: unique students (main), plus faces across all photos (repeats included).
export default function HeadcountSummary({ visit }) {
  const counted = visit.photos.filter((p) => p.type === 'headcount').length
  const failed = visit.photos.filter((p) => p.ai?.status === 'failed').length
  const photos = `${counted} headcount photo${counted === 1 ? '' : 's'}`
  const repeats = visit.facesSeen > visit.headcount
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-700 p-5 text-white sm:p-6">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-900/70" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sun-400">
          <MdGroups className="size-8" />
        </div>
        <div className="min-w-0" aria-live="polite">
          <p className="text-sm text-white/85">{visit.headcountManual ? 'Unique students (corrected by Admin)' : 'Unique students (AI)'}</p>
          <p className="text-4xl font-bold leading-tight">{formatNumber(visit.headcount)}</p>
          <p className="text-xs text-white/75">
            {visit.aiCounting
              ? 'AI is counting the students… this takes a few minutes'
              : visit.status === 'completed'
                ? `${repeats ? `${formatNumber(visit.facesSeen)} faces in ${photos} · each child counted once` : `From ${photos}`}${failed ? ` · ${failed} could not be counted` : ''}`
                : 'Counted by the AI when the visit is uploaded'}
          </p>
          {(visit.studentCount != null || visit.collateralCount != null) && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {visit.studentCount != null && (
                <p className="rounded-lg bg-white/15 px-2.5 py-1">
                  Student count: <b>{formatNumber(visit.studentCount)}</b>
                </p>
              )}
              {visit.collateralCount != null && (
                <p className="rounded-lg bg-white/15 px-2.5 py-1">
                  Collateral count: <b>{formatNumber(visit.collateralCount)}</b>
                </p>
              )}
            </div>
          )}

          <VisitStatusBadge status={visit.status} className="mt-2" />
        </div>
      </div>
    </div>
  )
}
