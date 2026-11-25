import { SortHeader } from '../../../components/table'
import { Avatar, Badge } from '../../../components/ui'
import { formatDate } from '../../../utils/format'

const avatarTone = (u) => ({ admin: 'bg-brand-100 text-brand-700', client: 'bg-purple-100 text-purple-700' })[u.role] ?? 'bg-amber-100 text-amber-800'

function Actions({ user, isMe, onToggleActive, onResetPassword }) {
  return (
    <div className="flex gap-4 text-sm font-semibold">
      <button type="button" onClick={() => onResetPassword(user)} className="text-brand-700 hover:underline">
        Reset password
      </button>
      {!isMe && (
        <button
          type="button"
          onClick={() => onToggleActive(user)}
          className={`hover:underline ${user.active ? 'text-accent-600' : 'text-green-600'}`}
        >
          {user.active ? 'Disable' : 'Enable'}
        </button>
      )}
    </div>
  )
}

const ROLE_BADGE = { admin: ['brand', 'Admin'], client: ['purple', 'Client'], staff: ['gray', 'Ground Team'] }
const RoleBadge = ({ role }) => {
  const [tone, label] = ROLE_BADGE[role] ?? ROLE_BADGE.staff
  return <Badge tone={tone}>{label}</Badge>
}
// Green dot while the user has an active session on the server.
const SignedInDot = ({ user }) =>
  user.signedIn ? <span className="size-2 shrink-0 rounded-full bg-green-500" title="Signed in now" aria-label="Signed in now" /> : null
const StatusBadge = ({ active }) => <Badge tone={active ? 'green' : 'red'}>{active ? 'Active' : 'Disabled'}</Badge>

// Table on tablet/desktop, cards on phones. Render inside a Card.
// table (optional): useTableState() result, makes the headers sortable (fields match USER_SORT).
export default function UserTable({ users, currentUsername, onToggleActive, onResetPassword, table }) {
  const actionProps = { onToggleActive, onResetPassword }
  const h = (label, field, className, firstDesc) => <SortHeader label={label} field={field} table={table} className={className} firstDesc={firstDesc} />
  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            {h('Name', 'name', 'px-5 py-3')}
            {h('Username', 'username')}
            {h('Role', 'role')}
            {h('Created', 'created', 'hidden px-3 py-3 lg:table-cell', true)}
            {h('Status', 'status')}
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.username} className={u.active ? '' : 'bg-gray-50/60'}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} className={avatarTone(u)} />
                  <span className="font-semibold">{u.name}</span>
                  <SignedInDot user={u} />
                </div>
              </td>
              <td className="px-3 py-3 text-gray-600">{u.username}</td>
              <td className="px-3 py-3">
                <RoleBadge role={u.role} />
              </td>
              <td className="hidden px-3 py-3 text-gray-700 lg:table-cell">{formatDate(u.createdAt)}</td>
              <td className="px-3 py-3">
                <StatusBadge active={u.active} />
              </td>
              <td className="px-3 py-3">
                <Actions user={u} isMe={u.username === currentUsername} {...actionProps} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-gray-100 md:hidden">
        {users.map((u) => (
          <li key={u.username} className="flex items-start gap-3 px-4 py-3.5">
            <Avatar name={u.name} className={avatarTone(u)} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{u.name}</span>
                <SignedInDot user={u} />
                <RoleBadge role={u.role} />
                <StatusBadge active={u.active} />
              </div>
              <p className="text-xs text-gray-500">
                {u.username} · created {formatDate(u.createdAt)}
              </p>
              <Actions user={u} isMe={u.username === currentUsername} {...actionProps} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
