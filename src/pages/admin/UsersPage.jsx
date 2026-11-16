import { useCallback, useEffect, useState } from 'react'
import { MdPersonAdd } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Button, Input, Modal, Spinner } from '../../components/ui'
import { useAuth } from '../../features/auth'
import { UserForm, UserTable } from '../../features/users'
import { createUser, listUsers, updateUser } from '../../services/api/users'

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const reload = useCallback(() => listUsers().then(setUsers), [])
  useEffect(() => {
    reload()
  }, [reload])

  const closeCreate = useCallback(() => setCreating(false), [])
  const closeReset = useCallback(() => setResetFor(null), [])

  const handleCreate = async (data) => {
    await createUser(data)
    setCreating(false)
    reload()
  }

  const handleReset = async (e) => {
    e.preventDefault()
    await updateUser(resetFor.id, { password: newPassword })
    setResetFor(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        subtitle="Create logins for admins and staff"
        action={
          <Button onClick={() => setCreating(true)}>
            <MdPersonAdd className="size-5" /> New user
          </Button>
        }
      />
      {!users ? (
        <Spinner className="mx-auto mt-10 size-6 text-brand-600" />
      ) : (
        <UserTable
          users={users}
          currentUserId={me.id}
          onToggleActive={(u) => updateUser(u.id, { active: !u.active }).then(reload)}
          onResetPassword={(u) => {
            setNewPassword('')
            setResetFor(u)
          }}
        />
      )}

      <Modal open={creating} title="New user" onClose={closeCreate}>
        <UserForm onSubmit={handleCreate} onCancel={closeCreate} />
      </Modal>

      <Modal open={!!resetFor} title={`Reset password · ${resetFor?.name ?? ''}`} onClose={closeReset}>
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeReset}>
              Cancel
            </Button>
            <Button type="submit">Save password</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
