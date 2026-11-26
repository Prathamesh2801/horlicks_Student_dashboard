import { useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, Spinner } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { DEFAULT_FORM, getFormSettings, saveFormSettings } from '../../services/api/settings.service'

const FIELDS = [
  ['poc', 'POC name', 'School point of contact'],
  ['contact', 'Contact number', 'POC’s 10-digit mobile number'],
]

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

// Admin: which optional fields the Ground Team visit form shows, and whether each is required.
export default function SettingsPage() {
  const { data, error, reload } = useAsync(getFormSettings)
  const [edit, setEdit] = useState(null) // changed, not saved
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // 'saved' | error message

  if (!data && !error) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  const form = edit ?? data?.form ?? DEFAULT_FORM
  const onServer = data?.onServer
  const set = (key, patch) => {
    setResult(null)
    setEdit({ ...form, [key]: { ...form[key], ...patch } })
  }
  const save = async () => {
    setSaving(true)
    try {
      await saveFormSettings(form)
      setEdit(null)
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
      {!onServer && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          These settings aren’t on the server yet, so the Ground Team form still shows both fields as required. The switches work as soon as
          the server adds <code>Admin/settings.php</code>.
        </p>
      )}
      <Card className="divide-y divide-gray-100">
        <h2 className="p-5 font-bold">Visit form fields</h2>
        {FIELDS.map(([key, label, help]) => (
          <div key={key} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
            <div className="mr-auto">
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-gray-500">{help}</p>
            </div>
            <Switch
              label={form[key].show ? 'Shown' : 'Hidden'}
              checked={form[key].show}
              onChange={(show) => set(key, { show })}
              disabled={!onServer}
            />
            <Switch
              label="Required"
              checked={form[key].show && form[key].required}
              onChange={(required) => set(key, { required })}
              disabled={!onServer || !form[key].show}
            />
          </div>
        ))}
        <div className="flex items-center justify-end gap-3 p-5">
          {result === 'saved' && (
            <span className="text-sm font-semibold text-green-700">Saved ✓ The Ground Team sees it on their next new visit.</span>
          )}
          {result && result !== 'saved' && <span className="text-sm text-accent-600">{result}</span>}
          <Button onClick={save} loading={saving} disabled={!onServer || !edit}>
            Save
          </Button>
        </div>
      </Card>
      <p className="text-xs text-gray-500">
        Hidden fields are not asked on the form and are left empty on new visits. Visits already uploaded keep their values.
      </p>
    </div>
  )
}
