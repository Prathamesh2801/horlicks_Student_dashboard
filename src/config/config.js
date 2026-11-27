// All app settings live here (no .env files).
import { brand } from './brand'

export const config = {
  // Horlicks School Tribes PHP API. Reference: docs/SERVER_API.md
  // BASE_URL_SERVER:"http://192.168.1.88/long_term_project/Horlicks_School_Tribes/API",
  // (then set API_PROXY to '/server-api')
  BASE_URL_SERVER: 'https://poshansepragati.theeventpics.com/API',
  // '' = the browser calls BASE_URL_SERVER directly (production: the API is https and allows any origin via CORS).
  // '/server-api' = call through a same-site path that the web server forwards to BASE_URL_SERVER; needed only for an
  // http API (an https page can't call http). `npm run dev` / `preview` forward it; production: docs/SERVER_API.md → Deploying.
  API_PROXY: "",

  appName: brand.fullName, // shown on sign-in, the Ground Team home and as the installed app name
};