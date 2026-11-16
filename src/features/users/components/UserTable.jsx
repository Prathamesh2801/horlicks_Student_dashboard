import { Badge, Button } from '../../../components/ui'
import { formatDate } from '../../../utils/format'

export default function UserTable({ users, currentUserId, onToggleActive, onResetPassword }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-gray-600">{u.username}</td>
              <td className="px-4 py-3">
                <Badge tone={u.role === 'admin' ? 'brand' : 'gray'}>{u.role === 'admin' ? 'Admin' : 'Staff'}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
              <td className="px-4 py-3">
                <Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Badge>
              </td>
              <td className="space-x-1 whitespace-nowrap px-4 py-3 text-right">
                <Button variant="ghost" className="px-2 py-1" onClick={() => onResetPassword(u)}>
                  Reset password
                </Button>
                {u.id !== currentUserId && (
                  <Button variant="ghost" className="px-2 py-1" onClick={() => onToggleActive(u)}>
                    {u.active ? 'Disable' : 'Enable'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
