// All app settings live here (no .env files).
export const config = {
  // Horlicks School Tribes PHP API (login + users). Reference: docs/SERVER_API.md
  BASE_URL_SERVER: 'http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API',

  appName: 'My Workbench',
  // Schools in the programme, for the "x% of 6,000" coverage figure.
  totalSchools: 6000,
  // Sample visits only: delay before the fake AI headcount comes back (ms).
  mockAiDelay: 3000,
}
