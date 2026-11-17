// Sort values for useTableState (keys match the SortHeader fields in UserTable).
export const USER_SORT = {
  name: (u) => u.name,
  username: (u) => u.username,
  role: (u) => u.role,
  created: (u) => u.createdAt,
  status: (u) => (u.active ? 0 : 1), // active first
}
