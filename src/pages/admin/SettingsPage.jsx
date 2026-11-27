import { useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, Spinner } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { getFormSettings, saveFormSettings, SWITCHABLE } from '../../services/api/settings.service'
import { formatDateTime } from '../../utils/format'

const HELP = {
  poc_contact: 'POC’s 10-digit mobile number',
  start_time: 'Recorded automatically when the form is opened',
  udise: '15-digit school code',
}

function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={`flex items-center gap-2 text-sm font-semibold ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:bg-green-600 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500" />
      {label}
    </label>
  )
}

// Admin: which fields the Ground Team visit form shows, and whether each is required (server: Admin/visit_form.php).
// Date, district, school name, location and photos are always required.
export default function SettingsPage() {
  const { data, error, reload } = useAsync(getFormSettings)
  const [edits, setEdits] = useState({}) // field → { show, required } changed, not saved
  const [upload, setUpload] = useState(null) // Upload button shown? (changed, not saved)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // 'saved' | error message

  if (!data && !error) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  const offline = data?.offline
  const value = (name) => edits[name] ?? data.form[name]
  const set = (name, patch) => {
    setResult(null)
    setEdits((e) => ({ ...e, [name]: { ...value(name), ...patch } }))
  }
  const changed = Object.keys(edits).filter((n) => edits[n].show !== data.form[n].show || edits[n].required !== data.form[n].required)
  const uploadChanged = upload !== null && upload !== data.uploadButton
  const changes = changed.length + (uploadChanged ? 1 : 0)
  const save = async () => {
    setSaving(true)
    try {
      await saveFormSettings(Object.fromEntries(changed.map((n) => [n, edits[n]])), uploadChanged ? upload : undefined)
      setEdits({})
      setUpload(null)
      setResult('saved')
      reload()
    } catch (err) {
      setResult(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Choose which fields the Ground Team fills in on a new visit." />
      {offline && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          Couldn’t load the settings from the server. Check the connection and try again.
        </p>
      )}
      <Card className="divide-y divide-gray-100">
        <div className="p-5">
          <h2 className="font-bold">Visit form fields</h2>
          <p className="text-xs text-gray-500">
            Date, district, school name, location and photos are always required.
            {data.updatedBy && ` Last changed by ${data.updatedBy} · ${formatDateTime(data.updatedAt)}.`}
          </p>
        </div>
        {SWITCHABLE.map(([name, label]) => {
          const f = value(name)
          return (
            <div key={name} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
              <div className="mr-auto">
                <p className="font-semibold">{label}</p>
                {HELP[name] && <p className="text-xs text-gray-500">{HELP[name]}</p>}
              </div>
              <Switch label={f.show ? 'Shown' : 'Hidden'} checked={f.show} onChange={(show) => set(name, { show })} disabled={offline} />
              <Switch
                label="Required"
                checked={f.show && f.required}
                onChange={(required) => set(name, { required })}
                disabled={offline || !f.show}
              />
            </div>
          )
        })}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-page/60 px-5 py-4">
          <div className="mr-auto">
            <p className="font-semibold">Upload button on the photos step</p>
            <p className="text-xs text-gray-500">
              Lets the Ground Team pick headcount photos from the phone’s gallery. Hidden = camera only. Normal photos are always camera
              only.
            </p>
          </div>
          <Switch
            label={(upload ?? data.uploadButton) ? 'Shown' : 'Hidden'}
            checked={upload ?? data.uploadButton}
            onChange={(v) => {
              setResult(null)
              setUpload(v)
            }}
            disabled={offline}
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-5">
          {result === 'saved' && (
            <span className="text-sm font-semibold text-green-700">Saved ✓ The Ground Team sees it on their next new visit.</span>
          )}
          {result && result !== 'saved' && <span className="text-sm text-accent-600">{result}</span>}
          <Button onClick={save} loading={saving} disabled={offline || !changes}>
            Save {changes ? `${changes} change${changes === 1 ? '' : 's'}` : ''}
          </Button>
        </div>
      </Card>
      <p className="text-xs text-gray-500">
        Hidden fields are not asked on the form and are left empty on new visits. Visits already uploaded keep their values.
      </p>
    </div>
  )
}
