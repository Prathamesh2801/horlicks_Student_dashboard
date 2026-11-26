// All app settings live here (no .env files).
export const config = {
  // Horlicks School Tribes PHP API. Reference: docs/SERVER_API.md
  // Local test server: 'http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API' (then set API_PROXY to '/server-api')
  BASE_URL_SERVER: 'https://poshansepragati.theeventpics.com/API',
  // '' = the browser calls BASE_URL_SERVER directly (production: the API is https and allows any origin via CORS).
  // '/server-api' = call through a same-site path that the web server forwards to BASE_URL_SERVER; needed only for an
  // http API (an https page can't call http). `npm run dev` / `preview` forward it; production: docs/SERVER_API.md → Deploying.
  API_PROXY: '',

  appName: 'My Workbench',
  // Schools in the programme, for the "x% of 6,000" coverage figure.
  totalSchools: 6000,
}
