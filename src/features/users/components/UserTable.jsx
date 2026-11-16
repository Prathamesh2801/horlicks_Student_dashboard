import { Avatar, Badge } from '../../../components/ui'
import { formatDate } from '../../../utils/format'

const avatarTone = (u) => (u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-800')

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

const RoleBadge = ({ role }) => <Badge tone={role === 'admin' ? 'brand' : 'gray'}>{role === 'admin' ? 'Admin' : 'Staff'}</Badge>
const StatusBadge = ({ active }) => <Badge tone={active ? 'green' : 'red'}>{active ? 'Active' : 'Disabled'}</Badge>

// Table on tablet/desktop, cards on phones. Render inside a Card with p-0.
export default function UserTable({ users, currentUserId, onToggleActive, onResetPassword }) {
  const actionProps = { onToggleActive, onResetPassword }
  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-page text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-3 py-3">Username</th>
            <th className="px-3 py-3">Role</th>
            <th className="hidden px-3 py-3 lg:table-cell">Created</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.id} className={u.active ? '' : 'bg-gray-50/60'}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} className={avatarTone(u)} />
                  <span className="font-semibold">{u.name}</span>
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
                <Actions user={u} isMe={u.id === currentUserId} {...actionProps} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-gray-100 md:hidden">
        {users.map((u) => (
          <li key={u.id} className="flex items-start gap-3 px-4 py-3.5">
            <Avatar name={u.name} className={avatarTone(u)} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{u.name}</span>
                <RoleBadge role={u.role} />
                <StatusBadge active={u.active} />
              </div>
              <p className="text-xs text-gray-500">
                {u.username} · created {formatDate(u.createdAt)}
              </p>
              <Actions user={u} isMe={u.id === currentUserId} {...actionProps} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
