import { useState } from 'react'
import { MdLock, MdPerson } from 'react-icons/md'
import { Button, Input } from '../../../components/ui'
import { ROLES } from '../../../constants/visit'

const ROLE_ICON = { staff: MdPerson, admin: MdLock }

export default function UserForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'staff' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ ...form, name: form.name.trim(), username: form.username.trim().toLowerCase() })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full name" value={form.name} onChange={set('name')} autoFocus required />
      <Input
        label="Username"
        value={form.username}
        onChange={set('username')}
        pattern="[a-zA-Z0-9._\-]{3,}"
        title="At least 3 letters, numbers, dots, dashes or underscores"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <Input
        label="Password"
        type="text"
        value={form.password}
        onChange={set('password')}
        minLength={6}
        hint="At least 6 characters. Share it with the user."
        autoComplete="new-password"
        required
      />
      <div>
        <p className="mb-1.5 text-sm font-semibold text-gray-800">Role</p>
        <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {ROLES.map((r) => {
            const Icon = ROLE_ICON[r.value]
            const active = form.role === r.value
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600'}`}
              >
                <Icon className="size-4" /> {r.label}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-gray-500">Staff use the phone app. Admins use this dashboard.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} className="min-w-24">
          Create
        </Button>
      </div>
    </form>
  )
}
