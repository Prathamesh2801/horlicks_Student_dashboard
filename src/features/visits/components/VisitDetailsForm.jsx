import { useEffect, useState } from 'react'
import { MdLocationOn } from 'react-icons/md'
import BottomBar from '../../../components/common/BottomBar'
import { Button, Card, Input, Select, Spinner } from '../../../components/ui'
import { useGeolocation } from '../../../hooks/useGeolocation'
import { CLASS_CATEGORIES, SCHOOL_TYPES } from '../../../constants/visit'
import { DEFAULT_FORM, getFormSettings } from '../../../services/api/settings.service'
import { getDistricts } from '../../../services/api/visits.service'
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

// Step 1 of a visit: Date, District, Village, UDISE, School name, School type, Class category, POC name + contact,
// GPS. Lists come from the server (cached for offline use); the Admin's settings hide fields or make them optional.
export default function VisitDetailsForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    date: todayISO(),
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
  const [districts, setDistricts] = useState([])
  const [districtsError, setDistrictsError] = useState(null)
  const [fields, setFields] = useState(DEFAULT_FORM) // admin settings: which fields are shown / required
  const geo = useGeolocation()
  const { locate } = geo

  useEffect(() => {
    getDistricts().then(setDistricts, (e) => setDistrictsError(e.message))
    getFormSettings().then((r) => setFields(r.form))
    locate().catch(() => {})
  }, [locate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const digits = (key, n) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '').slice(0, n) }))
  const contactValid = /^[6-9]\d{9}$/.test(form.pocContact)
  const udiseOk = /^\d{15}$/.test(form.udise) // UDISE code: 15 digits (client, 27 Nov)
  // Admin settings (server visit_form.php): hidden = not asked; optional = may be empty, but valid if filled.
  const shown = (name) => fields[name].show
  const req = (name) => fields[name].show && fields[name].required
  const ok = (name, filled, valid = true) => !shown(name) || (filled ? valid : !req(name))
  const ready =
    form.date &&
    form.district &&
    form.schoolName.trim().length >= 2 &&
    ok('village', !!form.village.trim(), form.village.trim().length >= 2) &&
    ok('udise', !!form.udise, udiseOk) &&
    ok('school_type', !!form.schoolType) &&
    ok('class_category', !!form.classCategory) &&
    ok('poc_name', !!form.pocName.trim(), form.pocName.trim().length >= 2) &&
    ok('poc_contact', !!form.pocContact, contactValid) &&
    geo.coords
  // What still stops "Continue", in form order (shown above the button).
  const missing = [
    !form.district && 'District',
    !ok('village', !!form.village.trim(), form.village.trim().length >= 2) && 'Village',
    !ok('udise', !!form.udise, udiseOk) && 'UDISE code',
    form.schoolName.trim().length < 2 && 'School name',
    !ok('school_type', !!form.schoolType) && 'School type',
    !ok('class_category', !!form.classCategory) && 'Class category',
    !ok('poc_name', !!form.pocName.trim(), form.pocName.trim().length >= 2) && 'POC name',
    !ok('poc_contact', !!form.pocContact, contactValid) && 'Contact number',
    !geo.coords && 'Location',
  ].filter(Boolean)
  const optional = (name, label) => (req(name) ? label : `${label} (optional)`)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ready) return
    const { lat, lng, accuracy } = geo.coords
    const only = (name, v) => (shown(name) ? v : '')
    onSubmit({
      ...form,
      city: form.district, // drafts and the photo geo-tag use `city` for the district
      village: only('village', form.village.trim()),
      udise: only('udise', form.udise),
      schoolType: only('school_type', form.schoolType),
      classCategory: only('class_category', form.classCategory),
      schoolName: form.schoolName.trim(),
      pocName: only('poc_name', form.pocName.trim()),
      pocContact: only('poc_contact', form.pocContact),
      lat,
      lng,
      accuracy,
      startedAt: shown('start_time') ? startedAt : null,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-4 p-5">
        <Input label="Date" type="date" value={form.date} max={todayISO()} onChange={set('date')} required />
        <Select
          label="District"
          placeholder="Select district"
          hint={districtsError ? `Couldn’t load districts: ${districtsError} Connect to the internet once.` : undefined}
          value={form.district}
          onChange={set('district')}
          options={districts.map((d) => ({ value: d, label: d }))}
          required
        />
        {shown('village') && (
          <Input
            label={optional('village', 'Village')}
            value={form.village}
            onChange={set('village')}
            minLength={2}
            maxLength={100}
            autoComplete="off"
            required={req('village')}
          />
        )}
        {shown('udise') && (
          <Input
            label={optional('udise', 'UDISE code')}
            inputMode="numeric"
            placeholder="15-digit school code"
            value={form.udise}
            onChange={digits('udise', 15)}
            maxLength={15}
            autoComplete="off"
            error={form.udise && !udiseOk ? `${15 - form.udise.length} more digits needed (UDISE is 15 digits)` : undefined}
            required={req('udise')}
          />
        )}
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
        {(shown('school_type') || shown('class_category')) && (
          <div className="grid grid-cols-2 gap-3">
            {shown('school_type') && (
              <Select
                label={optional('school_type', 'School type')}
                placeholder="Select"
                value={form.schoolType}
                onChange={set('schoolType')}
                options={SCHOOL_TYPES}
                required={req('school_type')}
              />
            )}
            {shown('class_category') && (
              <Select
                label={optional('class_category', 'Class category')}
                placeholder="Select"
                value={form.classCategory}
                onChange={set('classCategory')}
                options={CLASS_CATEGORIES}
                required={req('class_category')}
              />
            )}
          </div>
        )}
        {shown('poc_name') && (
          <Input
            label={optional('poc_name', 'POC name')}
            value={form.pocName}
            onChange={set('pocName')}
            minLength={2}
            maxLength={100}
            autoComplete="off"
            required={req('poc_name')}
          />
        )}
        {shown('poc_contact') && (
          <Input
            label={optional('poc_contact', 'Contact number')}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={form.pocContact}
            onChange={digits('pocContact', 10)}
            maxLength={10}
            autoComplete="off"
            error={
              form.pocContact && !contactValid
                ? form.pocContact.length < 10
                  ? `${10 - form.pocContact.length} more digits`
                  : 'Mobile numbers start with 6, 7, 8 or 9'
                : undefined
            }
            required={req('poc_contact')}
          />
        )}
        <LocationBox geo={geo} onRetry={() => locate().catch(() => {})} />
        <p className="text-xs text-gray-500">Location and time are saved automatically and can’t be typed in.</p>
      </Card>

      <BottomBar>
        {missing.length > 0 && (
          <p className="mb-2 text-center text-xs text-gray-600">
            To continue, fill or fix: <b className="text-red-600">{missing.join(', ')}</b>
          </p>
        )}
        <Button type="submit" size="xl" className="w-full" disabled={!ready} loading={submitting}>
          Continue to photos
        </Button>
      </BottomBar>
    </form>
  )
}
