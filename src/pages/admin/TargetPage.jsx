import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { LoadError } from '../../components/table'
import { Badge, Button, Card, Input, Spinner } from '../../components/ui'
import { STATUS, TargetCard, useCampaign } from '../../features/monitoring'
import { notifyChange } from '../../services/api/pending.service'
import { removeCityTarget, saveCityTarget } from '../../services/api/targets.service'
import { getCities } from '../../services/api/visits.service'
import { formatNumber, todayISO } from '../../utils/format'

const row = (t) => ({ visits: t ? String(t.target) : '', start: t?.start ?? '', end: t?.end ?? '' })
const same = (a, b) => a.visits === b.visits && a.start === b.start && a.end === b.end

// Admin sets a visit target per city, each with its own start and finish date (server: Admin/target.php).
// The overall target is the total; the server works out progress, run-rate and projected finish.
export default function TargetPage() {
  const campaign = useCampaign()
  const saved = Object.fromEntries((campaign.data?.byCity ?? []).map((t) => [t.city, t]))
  const [cities, setCities] = useState([])
  const [edits, setEdits] = useState({}) // city → { visits, start, end } changed but not saved
  const [all, setAll] = useState({ start: todayISO(), end: '' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // { saved, errors: { city: message } }

  useEffect(() => {
    getCities().then(setCities, () => {})
  }, [])

  const value = (c) => edits[c] ?? row(saved[c])
  const set = (c, patch) => {
    setResult(null)
    setEdits((e) => ({ ...e, [c]: { ...value(c), ...patch } }))
  }
  const changed = cities.filter((c) => edits[c] && !same(edits[c], row(saved[c])))
  const total = cities.reduce((s, c) => s + (Number(value(c).visits) || 0), 0)
  const problem = (v) =>
    !v.visits
      ? null
      : !(Number(v.visits) >= 1)
        ? 'Target must be 1 or more'
        : !v.end
          ? 'Add a finish date'
          : v.start && v.end < v.start
            ? 'Finish is before start'
            : null

  const applyDates = () => cities.forEach((c) => value(c).visits && set(c, { start: all.start, end: all.end }))

  const save = async () => {
    setSaving(true)
    const errors = {}
    let done = 0
    for (const c of changed) {
      const v = edits[c]
      try {
        if (!v.visits) {
          if (saved[c]) await removeCityTarget(c)
        } else await saveCityTarget(c, { visits: v.visits, start: v.start || todayISO(), end: v.end }, Boolean(saved[c]))
        done++
      } catch (err) {
        errors[c] = err.message
      }
    }
    setEdits((e) => Object.fromEntries(Object.entries(e).filter(([c]) => errors[c])))
    setResult({ saved: done, errors })
    setSaving(false)
    notifyChange() // reload targets everywhere
  }

  if (campaign.error && !campaign.data) return <LoadError message={campaign.error} onRetry={campaign.reload} />
  if (campaign.loading) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  const invalid = changed.some((c) => problem(edits[c]))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Target"
        subtitle="A visit target for each district with its own start and finish date. The overall target is the total."
      />

      <Card className="flex flex-wrap items-end gap-3 p-5">
        <div className="mr-auto">
          <h2 className="font-bold">Same dates for every district</h2>
          <p className="text-xs text-gray-500">Fills the dates of all districts that have a target. Then press Save.</p>
        </div>
        <Input
          label="Start"
          type="date"
          value={all.start}
          onChange={(e) => setAll((a) => ({ ...a, start: e.target.value }))}
          className="w-40"
        />
        <Input
          label="Finish"
          type="date"
          value={all.end}
          min={all.start}
          onChange={(e) => setAll((a) => ({ ...a, end: e.target.value }))}
          className="w-40"
        />
        <Button variant="secondary" onClick={applyDates} disabled={!all.end}>
          Apply to all
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">District</th>
                <th className="px-3 py-3">Target (visits)</th>
                <th className="px-3 py-3">Start</th>
                <th className="px-3 py-3">Finish</th>
                <th className="px-3 py-3">Done</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cities.map((c) => {
                const v = value(c)
                const t = saved[c]
                const err = (edits[c] && problem(edits[c])) || result?.errors[c]
                return (
                  <tr key={c} className={edits[c] && !same(edits[c], row(t)) ? 'bg-amber-50/50' : ''}>
                    <td className="px-5 py-2.5 font-semibold">
                      {c}
                      {err && <p className="text-xs font-normal text-accent-600">{err}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        aria-label={`${c} target`}
                        inputMode="numeric"
                        placeholder="No target"
                        value={v.visits}
                        onChange={(e) => set(c, { visits: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                        className="w-32"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        aria-label={`${c} start`}
                        type="date"
                        value={v.start}
                        onChange={(e) => set(c, { start: e.target.value })}
                        className="w-40"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        aria-label={`${c} finish`}
                        type="date"
                        value={v.end}
                        min={v.start || undefined}
                        onChange={(e) => set(c, { end: e.target.value })}
                        className="w-40"
                      />
                    </td>
                    <td className="px-3 py-2.5">{t ? `${formatNumber(t.done)} (${Math.round(t.pct * 100)}%)` : '—'}</td>
                    <td className="px-5 py-2.5">
                      {t ? <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge> : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <p className="text-sm">
            <b>Total {formatNumber(total)}</b> visits
            <span className="text-gray-500"> · clear a target to remove it · rejected visits don’t count</span>
          </p>
          <div className="flex items-center gap-3">
            {result && !Object.keys(result.errors).length && <span className="text-sm font-semibold text-green-700">Saved ✓</span>}
            {result && Object.keys(result.errors).length > 0 && (
              <span className="text-sm font-semibold text-accent-600">{Object.keys(result.errors).length} not saved</span>
            )}
            <Button onClick={save} loading={saving} disabled={!changed.length || invalid}>
              Save {changed.length ? `${changed.length} change${changed.length === 1 ? '' : 's'}` : ''}
            </Button>
          </div>
        </div>
      </Card>

      {campaign.progress && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">As it shows on the dashboard</h2>
          <TargetCard data={campaign.progress} />
        </section>
      )}
    </div>
  )
}
