import { useEffect, useState } from 'react'
import { MdLocationOn } from 'react-icons/md'
import BottomBar from '../../../components/common/BottomBar'
import { Button, Card, Input, Select, Spinner } from '../../../components/ui'
import { useGeolocation } from '../../../hooks/useGeolocation'
import { CLASS_CATEGORIES, SCHOOL_TYPES } from '../../../constants/visit'
import { DEFAULT_FORM, getFormSettings } from '../../../services/api/settings.service'
import { getCities, getDistricts } from '../../../services/api/visits.service'
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
    <div
      className={`flex items-center gap-3 rounded-xl p-3.5 text-sm ${geo.error ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}
    >
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

// Step 1 of a visit: Date, City + District (server lists, cached for offline use), Village, UDISE, School name, School type,
// Class category, POC name + contact number, GPS.
export default function VisitDetailsForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    date: todayISO(),
    city: '',
    district: '',
    village: '',
    udise: '',
    schoolName: '',
    schoolType: '',
    classCategory: '',
    pocName: '',
    pocContact: '',
  })
  // Visit Start Timestamp: when the form was opened (not when it's submitted).
  const [startedAt] = useState(() => new Date().toISOString())
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [citiesError, setCitiesError] = useState(null)
  const [fields, setFields] = useState(DEFAULT_FORM) // admin: show / require POC name and Contact number
  const geo = useGeolocation()
  const { locate } = geo

  useEffect(() => {
    getCities().then(setCities, (e) => setCitiesError(e.message))
    getDistricts().then(setDistricts)
    getFormSettings().then((r) => setFields(r.form))
    locate().catch(() => {})
  }, [locate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const contactValid = /^[6-9]\d{9}$/.test(form.pocContact)
  const { poc, contact } = fields
  // Hidden = not asked. Optional = may be left empty, but must be valid if filled.
  const pocOk = !poc.show || form.pocName.trim().length >= 2 || (!poc.required && !form.pocName.trim())
  const contactOk = !contact.show || contactValid || (!contact.required && !form.pocContact)
  const udiseOk = /^\d{11}$/.test(form.udise) // UDISE+ school codes are 11 digits
  const digits = (key, n) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '').slice(0, n) }))
  const ready =
    form.date &&
    form.city &&
    form.district &&
    form.village.trim().length >= 2 &&
    udiseOk &&
    form.schoolName.trim().length >= 2 &&
    form.schoolType &&
    form.classCategory &&
    pocOk &&
    contactOk &&
    geo.coords

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ready) return
    const { lat, lng, accuracy } = geo.coords
    onSubmit({
      ...form,
      village: form.village.trim(),
      schoolName: form.schoolName.trim(),
      pocName: poc.show ? form.pocName.trim() : '',
      pocContact: contact.show ? form.pocContact : '',
      lat,
      lng,
      accuracy,
      startedAt,
    })
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
        <Select
          label="District"
          placeholder="Select district"
          value={form.district}
          onChange={set('district')}
          options={districts.map((d) => ({ value: d, label: d }))}
          required
        />
        <Input label="Village" value={form.village} onChange={set('village')} minLength={2} maxLength={100} autoComplete="off" required />
        <Input
          label="UDISE code"
          inputMode="numeric"
          placeholder="11-digit school code"
          value={form.udise}
          onChange={digits('udise', 11)}
          maxLength={11}
          autoComplete="off"
          hint={form.udise && !udiseOk ? `${11 - form.udise.length} more digits` : undefined}
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
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="School type"
            placeholder="Select"
            value={form.schoolType}
            onChange={set('schoolType')}
            options={SCHOOL_TYPES}
            required
          />
          <Select
            label="Class category"
            placeholder="Select"
            value={form.classCategory}
            onChange={set('classCategory')}
            options={CLASS_CATEGORIES}
            required
          />
        </div>
        {poc.show && (
          <Input
            label={poc.required ? 'POC name' : 'POC name (optional)'}
            value={form.pocName}
            onChange={set('pocName')}
            minLength={2}
            maxLength={100}
            autoComplete="off"
            required={poc.required}
          />
        )}
        {contact.show && (
          <Input
            label={contact.required ? 'Contact number' : 'Contact number (optional)'}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={form.pocContact}
            onChange={digits('pocContact', 10)}
            maxLength={10}
            autoComplete="off"
            hint={
              form.pocContact && !contactValid
                ? form.pocContact.length < 10
                  ? `${10 - form.pocContact.length} more digits`
                  : 'Mobile numbers start with 6, 7, 8 or 9'
                : undefined
            }
            required={contact.required}
          />
        )}
        <LocationBox geo={geo} onRetry={() => locate().catch(() => {})} />
        <p className="text-xs text-gray-500">Location and time are saved automatically and can’t be typed in.</p>
      </Card>

      <BottomBar>
        <Button type="submit" size="xl" className="w-full" disabled={!ready} loading={submitting}>
          Continue to photos
        </Button>
      </BottomBar>
    </form>
  )
}
