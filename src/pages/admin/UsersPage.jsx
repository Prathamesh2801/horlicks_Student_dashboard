import { useCallback, useEffect, useState } from 'react'
import { MdAdd, MdCloudOff } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, Input, Modal, Spinner } from '../../components/ui'
import { useAuth } from '../../features/auth'
import { UserForm, UserTable } from '../../features/users'
import { createUser, listUsers, setUserActive, updateUser } from '../../services/api/users.service'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [notice, setNotice] = useState(null) // { tone: 'ok' | 'error', text }

  const reload = useCallback(
    () =>
      listUsers().then(
        (list) => {
          setUsers(list)
          setLoadError(null)
        },
        (err) => setLoadError(err.message),
      ),
    [],
  )
  useEffect(() => {
    reload()
  }, [reload])

  // Auto-hide the message.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const closeCreate = useCallback(() => setCreating(false), [])
  const closeReset = useCallback(() => setResetFor(null), [])

  const handleCreate = async (data) => {
    const user = await createUser(data) // errors are shown inside the form
    setCreating(false)
    setNotice({ tone: 'ok', text: `Login created for ${user.name} (${user.username}).` })
    reload()
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setSaving(true)
    setResetError(null)
    try {
      const { sessionEnded } = await updateUser(resetFor.username, { password: newPassword })
      setNotice({
        tone: 'ok',
        text: `Password updated for ${resetFor.name}.${sessionEnded ? ' They were signed out and must log in with the new password.' : ''}`,
      })
      setResetFor(null)
      reload()
    } catch (err) {
      setResetError(err.message)
    }
    setSaving(false)
  }

  const toggleActive = async (u) => {
    try {
      await setUserActive(u.username, !u.active)
      setNotice({ tone: 'ok', text: `${u.name} ${u.active ? 'disabled and signed out' : 'enabled'}.` })
      reload()
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    }
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
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${notice.tone === 'ok' ? 'bg-green-50 text-green-800 ring-green-100' : 'bg-red-50 text-red-700 ring-red-100'}`}
        >
          {notice.text}
        </p>
      )}

      {loadError && !users ? (
        <EmptyState
          icon={MdCloudOff}
          title="Couldn’t load users"
          text={loadError}
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : !users ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
      ) : (
        <Card className="overflow-hidden">
          <UserTable
            users={users}
            currentUsername={me.username}
            onToggleActive={toggleActive}
            onResetPassword={(u) => {
              setNewPassword('')
              setResetError(null)
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
            minLength={8}
            maxLength={72}
            hint="8–72 characters (server rule). Share it with the user. They will be signed out."
            autoComplete="new-password"
            autoFocus
            required
          />
          {resetError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {resetError}
            </p>
          )}
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
