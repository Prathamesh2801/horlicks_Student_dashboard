import { useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, Spinner } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { getFormSettings, saveFormSettings } from '../../services/api/settings.service'
import { formatDateTime } from '../../utils/format'

const ROWS = [
  ['poc_name', 'POC name', 'On: the Ground Team must fill it in. Off: not asked.'],
  ['poc_contact', 'Contact number', 'On: the Ground Team must fill it in. Off: not asked.'],
  ['upload_button', 'Upload button', 'On: headcount photos can also be picked from the gallery. Off: camera only.'],
]

// Admin: three on / off switches for the Ground Team visit form (server: Admin/visit_form.php).
export default function SettingsPage() {
  const { data, error } = useAsync(getFormSettings)
  const [edit, setEdit] = useState(null) // changed, not saved
  const [saved, setSaved] = useState(null) // last saved values
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // 'saved' | error message

  if (!data && !error) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  const current = saved ?? data.settings
  const value = edit ?? current
  const changed = ROWS.some(([k]) => value[k] !== current[k])
  const save = async () => {
    setSaving(true)
    try {
      await saveFormSettings(value)
      setSaved(value)
      setEdit(null)
      setResult('saved')
    } catch (err) {
      setResult(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="What the Ground Team sees on a new visit." />
      {data.offline && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          Couldn’t load the settings from the server. Check the connection and try again.
        </p>
      )}
      <Card className="divide-y divide-gray-100">
        {ROWS.map(([key, label, help]) => (
          <label key={key} className={`flex items-center gap-4 px-5 py-4 ${data.offline ? 'opacity-50' : 'cursor-pointer'}`}>
            <span className="mr-auto">
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-gray-500">{help}</span>
            </span>
            <span className={`text-sm font-semibold ${value[key] ? 'text-green-700' : 'text-gray-500'}`}>{value[key] ? 'On' : 'Off'}</span>
            <input
              type="checkbox"
              role="switch"
              aria-label={label}
              checked={value[key]}
              disabled={data.offline}
              onChange={(e) => {
                setResult(null)
                setEdit({ ...value, [key]: e.target.checked })
              }}
              className="peer sr-only"
            />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:bg-green-600 peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500" />
          </label>
        ))}
        <div className="flex flex-wrap items-center justify-end gap-3 p-5">
          {data.updatedBy && !result && (
            <span className="mr-auto text-xs text-gray-500">
              Last changed by {data.updatedBy} · {formatDateTime(data.updatedAt)}
            </span>
          )}
          {result === 'saved' && (
            <span className="text-sm font-semibold text-green-700">Saved ✓ The Ground Team sees it on their next new visit.</span>
          )}
          {result && result !== 'saved' && <span className="text-sm text-accent-600">{result}</span>}
          <Button onClick={save} loading={saving} disabled={data.offline || !changed}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  )
}
