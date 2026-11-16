// All app settings live here (no .env files).
export const config = {
  // true = in-browser mock API (localStorage). Set false once the backend is ready.
  useMock: true,
  apiUrl: 'http://localhost:4000/api',
  appName: 'My Workbench',
  // Mock AI delay before a headcount comes back (ms)
  mockAiDelay: 3000,
}
