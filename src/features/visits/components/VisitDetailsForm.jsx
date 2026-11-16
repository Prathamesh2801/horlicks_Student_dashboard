import { useEffect, useState } from 'react'
import { MdMyLocation } from 'react-icons/md'
import { Button, Input, Select } from '../../../components/ui'
import { useGeolocation } from '../../../hooks/useGeolocation'
import { getCities } from '../../../services/api/cities'
import { todayISO } from '../../../utils/format'

// Step 1 of a visit: Date, City (from the client's list), School name + GPS.
export default function VisitDetailsForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({ date: todayISO(), cityId: '', schoolName: '' })
  const [cities, setCities] = useState([])
  const geo = useGeolocation()
  const { locate } = geo

  useEffect(() => {
    getCities().then(setCities)
    locate().catch(() => {})
  }, [locate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const ready = form.date && form.cityId && form.schoolName.trim() && geo.coords

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ready) onSubmit({ ...form, schoolName: form.schoolName.trim(), ...geo.coords })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Date" type="date" value={form.date} max={todayISO()} onChange={set('date')} required />
      <Select
        label="City"
        placeholder="Select city"
        value={form.cityId}
        onChange={set('cityId')}
        options={cities.map((c) => ({ value: c.id, label: `${c.name} (${c.district})` }))}
        required
      />
      <Input
        label="School name"
        placeholder="e.g. Govt. UP School, Patia"
        value={form.schoolName}
        onChange={set('schoolName')}
        autoComplete="off"
        required
      />

      <div
        className={`flex items-center gap-3 rounded-lg p-3 text-sm ${geo.coords ? 'bg-green-50 text-green-800' : geo.error ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}
      >
        <MdMyLocation className="size-5 shrink-0" />
        <p className="flex-1">
          {geo.loading
            ? 'Getting your location…'
            : geo.coords
              ? `Location captured (±${geo.coords.accuracy} m)`
              : geo.error ?? 'Location is needed to start a visit.'}
        </p>
        {!geo.loading && !geo.coords && (
          <Button variant="secondary" className="px-3 py-1.5" onClick={() => locate().catch(() => {})}>
            Retry
          </Button>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={!ready} loading={submitting}>
        Continue to photos
      </Button>
    </form>
  )
}
