import { useState } from 'react'
import { Button, Input, Select } from '../../../components/ui'
import { ROLES } from '../../../constants/visit'

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
      <Input label="Full name" value={form.name} onChange={set('name')} required />
      <Input
        label="Username"
        value={form.username}
        onChange={set('username')}
        pattern="[a-zA-Z0-9._-]{3,}"
        title="At least 3 letters, numbers, dots, dashes or underscores"
        autoComplete="off"
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
      <Select label="Role" value={form.role} onChange={set('role')} options={ROLES} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Create login
        </Button>
      </div>
    </form>
  )
}
