// All app settings live here (no .env files).
export const config = {
  // Horlicks School Tribes PHP API (login + users). Reference: docs/SERVER_API.md
  BASE_URL_SERVER: 'http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API',
  // The app calls the API through this path on its own site, and the web server forwards it to BASE_URL_SERVER
  // (`npm run dev` and `npm run preview` do this already; production: see docs/SERVER_API.md → Deploying).
  // This avoids the browser blocking http API calls from an https page, and works for phones off the LAN.
  // Set to '' to call BASE_URL_SERVER directly (only if the API itself is https).
  API_PROXY: '/server-api',

  appName: 'My Workbench',
  // Schools in the programme, for the "x% of 6,000" coverage figure.
  totalSchools: 6000,
}
