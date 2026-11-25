import { useCallback, useEffect, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { LoadError, NoResults, Pagination, RefreshBar, StaleBanner, TableSkeleton, TableToolbar, useTableState } from '../../components/table'
import { Button, Card, Input, Modal, Select } from '../../components/ui'
import { useAuth } from '../../features/auth'
import { USER_SORT, UserForm, UserTable } from '../../features/users'
import { useAsync } from '../../hooks/useAsync'
import { createUser, listUsers, setUserActive, updateUser } from '../../services/api/users.service'
import { formatNumber, formatTime } from '../../utils/format'

const ROLE_FILTERS = [
  { value: 'admin', label: 'Admins' },
  { value: 'staff', label: 'Staff' },
  { value: 'client', label: 'Clients' },
]
const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'online', label: 'Signed in now' },
]
const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
  { value: '-created', label: 'Newest first' },
  { value: 'created', label: 'Oldest first' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Active first' },
]
const statusMatches = (u, status) =>
  !status || (status === 'active' ? u.active : status === 'disabled' ? !u.active : u.signedIn)

export default function UsersPage() {
  const { user: me } = useAuth()
  const { data: users, error, loading, refreshing, loadedAt, reload } = useAsync(listUsers)
  const table = useTableState({
    rows: users,
    filters: { role: '', status: '' },
    defaultSort: 'name',
    sortValue: USER_SORT,
    searchText: (u) => `${u.name} ${u.username}`,
    matches: (u, s) => (!s.role || u.role === s.role) && statusMatches(u, s.status),
  })
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [notice, setNotice] = useState(null) // { tone: 'ok' | 'error', text }

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
        subtitle={
          loading
            ? 'Loading…'
            : `${formatNumber(table.total)} of ${formatNumber(users?.length ?? 0)} user${users?.length === 1 ? '' : 's'}${loadedAt ? ` · updated ${formatTime(loadedAt)}` : ''}`
        }
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

      <TableToolbar table={table} placeholder="Search name or username" onRefresh={reload} refreshing={refreshing} sortOptions={SORT_OPTIONS}>
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-36"
          aria-label="Role"
          placeholder="All roles"
          value={table.state.role}
          onChange={(e) => table.set({ role: e.target.value })}
          options={ROLE_FILTERS}
        />
        <Select
          className="w-[calc(50%-0.25rem)] sm:w-40"
          aria-label="Status"
          placeholder="All statuses"
          value={table.state.status}
          onChange={(e) => table.set({ status: e.target.value })}
          options={STATUS_FILTERS}
        />
      </TableToolbar>

      {error && users && <StaleBanner message={error} onRetry={reload} />}

      {error && !users ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
        <Card className="overflow-hidden">
          <RefreshBar active={refreshing && !loading} />
          {loading ? (
            <TableSkeleton />
          ) : table.total === 0 ? (
            <NoResults onClear={table.isFiltered ? table.reset : undefined} text={table.isFiltered ? undefined : 'No users yet.'} />
          ) : (
            <div className={`transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
              <UserTable
                users={table.rows}
                table={table}
                currentUsername={me.username}
                onToggleActive={toggleActive}
                onResetPassword={(u) => {
                  setNewPassword('')
                  setResetError(null)
                  setResetFor(u)
                }}
              />
              <Pagination table={table} noun="users" />
            </div>
          )}
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
