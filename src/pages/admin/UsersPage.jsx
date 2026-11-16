import { useCallback, useEffect, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, Input, Modal, Spinner } from '../../components/ui'
import { useAuth } from '../../features/auth'
import { UserForm, UserTable } from '../../features/users'
import { createUser, listUsers, updateUser } from '../../services/api/users'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const reload = useCallback(() => listUsers().then(setUsers), [])
  useEffect(() => {
    reload()
  }, [reload])

  // Auto-hide the success message.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const closeCreate = useCallback(() => setCreating(false), [])
  const closeReset = useCallback(() => setResetFor(null), [])

  const handleCreate = async (data) => {
    const user = await createUser(data)
    setCreating(false)
    setNotice(`Login created for ${user.name} (${user.username}).`)
    reload()
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateUser(resetFor.id, { password: newPassword })
    setSaving(false)
    setNotice(`Password updated for ${resetFor.name}.`)
    setResetFor(null)
  }

  const toggleActive = async (u) => {
    await updateUser(u.id, { active: !u.active })
    setNotice(`${u.name} ${u.active ? 'disabled' : 'enabled'}.`)
    reload()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        subtitle="Create logins for admins and staff"
        action={
          <Button onClick={() => setCreating(true)}>
            <MdAdd className="size-5" /> New user
          </Button>
        }
      />

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800 ring-1 ring-green-100">
          {notice}
        </p>
      )}

      {!users ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <Card className="overflow-hidden">
          <UserTable
            users={users}
            currentUserId={me.id}
            onToggleActive={toggleActive}
            onResetPassword={(u) => {
              setNewPassword('')
              setResetFor(u)
            }}
          />
        </Card>
      )}

      <Modal open={creating} title="New user" subtitle="The user signs in with this username and password." onClose={closeCreate}>
        <UserForm onSubmit={handleCreate} onCancel={closeCreate} />
      </Modal>

      <Modal open={!!resetFor} title="Reset password" subtitle={resetFor ? `${resetFor.name} · ${resetFor.username}` : ''} onClose={closeReset}>
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            hint="At least 6 characters. Share it with the user."
            autoComplete="new-password"
            autoFocus
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeReset}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
