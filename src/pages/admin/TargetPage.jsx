import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, Input, Spinner } from '../../components/ui'
import { campaignProgress, TargetCard } from '../../features/monitoring'
import { useCampaign } from '../../features/monitoring/useCampaign'
import { SAVED_LOCALLY, saveTarget } from '../../services/api/pending.service'
import { getCities } from '../../services/api/visits.service'
import { formatNumber, todayISO } from '../../utils/format'

// Admin sets the campaign dates and a target (approved visits) for each city; the overall target is the total.
export default function TargetPage() {
  const { target, data, loading } = useCampaign()
  const [cities, setCities] = useState([])
  const [edits, setEdits] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getCities().then(setCities, (e) => setError(e.message))
  }, [])
  // The saved target (once loaded) until the admin changes something.
  const form = edits ?? (loading ? null : (target ?? { start: todayISO(), end: '', cities: {} }))

  const total = form ? cities.reduce((s, c) => s + (Number(form.cities[c]) || 0), 0) : 0
  const valid = form && form.start && form.end && form.end >= form.start && total > 0
  // Preview with the numbers as typed (cheap: a few cities).
  const preview = (() => {
    if (!valid) return null
    const t = { ...form, cities: Object.fromEntries(cities.map((c) => [c, Number(form.cities[c]) || 0])) }
    return campaignProgress(t, data?.visits ?? [])
  })()

  if (!form) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  const set = (patch) => {
    setSaved(false)
    setEdits({ ...form, ...patch })
  }
  const setCity = (city, value) => set({ cities: { ...form.cities, [city]: value.replace(/\D/g, '').slice(0, 7) } })

  const save = async (e) => {
    e.preventDefault()
    await saveTarget({ start: form.start, end: form.end, cities: Object.fromEntries(cities.map((c) => [c, Number(form.cities[c]) || 0])) })
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Target" subtitle="Set a target for each city, counted in approved visits. The overall target is the total." />
      <form onSubmit={save} className="space-y-5">
        <Card className="p-5">
          <h2 className="font-bold">Campaign</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Input label="Start date" type="date" value={form.start} onChange={(e) => set({ start: e.target.value })} required />
            <Input label="End date" type="date" value={form.end} min={form.start} onChange={(e) => set({ end: e.target.value })} required />
            <Input label="Overall target (total of cities)" value={formatNumber(total)} readOnly className="[&_input]:bg-page" />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <h2 className="font-bold">City targets</h2>
            <p className="text-xs text-gray-500">Cities come from the programme city list</p>
          </div>
          {error && <p className="px-5 pt-3 text-sm text-red-700">{error}</p>}
          <ul className="mt-3 divide-y divide-gray-100">
            {cities.map((c) => (
              <li key={c} className="flex items-center gap-4 px-5 py-2.5">
                <span className="flex-1 font-semibold">{c}</span>
                <Input
                  aria-label={`${c} target`}
                  inputMode="numeric"
                  placeholder="0"
                  value={form.cities[c] ?? ''}
                  onChange={(e) => setCity(c, e.target.value)}
                  className="w-36"
                />
                <span className="w-12 text-sm text-gray-500">visits</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
            <p className="text-sm">
              <b>Total {formatNumber(total)}</b> visits · <span className="text-gray-500">{SAVED_LOCALLY}</span>
            </p>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm font-semibold text-green-700">Saved ✓</span>}
              <Button type="submit" disabled={!valid}>
                Save target
              </Button>
            </div>
          </div>
        </Card>
      </form>

      {preview && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Preview · as it shows on the dashboard</h2>
          <TargetCard data={preview} />
        </section>
      )}
    </div>
  )
}
