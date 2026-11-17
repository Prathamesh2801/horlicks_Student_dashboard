import { useEffect, useState } from 'react'
import { MdLocationOn } from 'react-icons/md'
import BottomBar from '../../../components/common/BottomBar'
import { Button, Card, Input, Select, Spinner } from '../../../components/ui'
import { useGeolocation } from '../../../hooks/useGeolocation'
import { getCities } from '../../../services/api/visits.service'
import { formatCoords, formatTime, todayISO } from '../../../utils/format'

function LocationBox({ geo, onRetry }) {
  if (geo.coords)
    return (
      <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3.5 ring-1 ring-green-100">
        <MdLocationOn className="mt-0.5 size-5 shrink-0 text-green-600" />
        <div className="text-sm">
          <p className="font-semibold text-green-700">Location captured (±{geo.coords.accuracy} m)</p>
          <p className="text-xs text-gray-700">
            {formatCoords(geo.coords.lat, geo.coords.lng)} · {formatTime(geo.coords.capturedAt)}
          </p>
        </div>
      </div>
    )
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3.5 text-sm ${geo.error ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
      {geo.loading ? <Spinner className="size-5 shrink-0" /> : <MdLocationOn className="size-5 shrink-0" />}
      <p className="flex-1">{geo.loading ? 'Getting your location…' : (geo.error ?? 'Location is needed to start a visit.')}</p>
      {!geo.loading && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

// Step 1 of a visit: Date, City (server list, cached for offline use), School name + GPS.
export default function VisitDetailsForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({ date: todayISO(), city: '', schoolName: '' })
  const [cities, setCities] = useState([])
  const [citiesError, setCitiesError] = useState(null)
  const geo = useGeolocation()
  const { locate } = geo

  useEffect(() => {
    getCities().then(setCities, (e) => setCitiesError(e.message))
    locate().catch(() => {})
  }, [locate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const ready = form.date && form.city && form.schoolName.trim().length >= 2 && geo.coords

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ready) return
    const { lat, lng, accuracy } = geo.coords
    onSubmit({ ...form, schoolName: form.schoolName.trim(), lat, lng, accuracy })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-4 p-5">
        <Input label="Date" type="date" value={form.date} max={todayISO()} onChange={set('date')} required />
        <Select
          label="City"
          placeholder="Select city"
          hint={citiesError ? `Couldn’t load cities: ${citiesError} Connect to the internet once.` : 'From the programme’s city list'}
          value={form.city}
          onChange={set('city')}
          options={cities.map((c) => ({ value: c, label: c }))}
          required
        />
        <Input
          label="School name"
          placeholder="e.g. Govt. UP School, Patia"
          value={form.schoolName}
          onChange={set('schoolName')}
          minLength={2}
          maxLength={150}
          autoComplete="off"
          required
        />
        <LocationBox geo={geo} onRetry={() => locate().catch(() => {})} />
        <p className="text-xs text-gray-500">Location and time are saved automatically. Staff cannot type them.</p>
      </Card>

      <BottomBar>
        <Button type="submit" size="xl" className="w-full" disabled={!ready} loading={submitting}>
          Continue to photos
        </Button>
      </BottomBar>
    </form>
  )
}
