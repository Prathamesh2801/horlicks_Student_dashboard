import { config } from '../../config/config'
import { api, API_BASE, fileUrl } from './client'

// Server: Admin/report.php — PDF reports built by the server (contract in docs/SERVER_API.md → "Report PDF").
// Not on the server yet: until it is, calls fail and the Reports page says so.
const REPORTS = '/Admin/report.php'

const STATUS_FROM = { processing: 'processing', ready: 'ready', failed: 'failed' }

// Server link → one the app can open (through the proxy for files on the API server).
const link = (url) =>
  !url
    ? null
    : url.startsWith(config.BASE_URL_SERVER)
      ? API_BASE + url.slice(config.BASE_URL_SERVER.length)
      : /^https?:/.test(url)
        ? url
        : fileUrl(url)

const toReport = (r) => ({
  id: String(r.Report_ID),
  title: r.Title,
  status: STATUS_FROM[String(r.Status).toLowerCase()] ?? 'processing',
  url: link(r.Download_Url),
  visits: r.Visit_Count ?? null,
  photos: r.Photo_Count ?? null,
  period: r.Period ?? null,
  createdAt: r.Created_AT ? r.Created_AT.replace(' ', 'T') : null,
  error: r.Error ?? null,
})

// Either filters (all approved visits matching them) or visitIds (only those). Returns the report (maybe still processing).
export async function createReport({ title, filters, visitIds }) {
  const body = { title }
  if (visitIds) body.visit_ids = visitIds.map(Number)
  else body.filters = filters // { date_from, date_to, city, username, ai }
  const data = await api.post(REPORTS, body)
  return toReport(data.Data ?? data)
}

export async function getReport(id) {
  const data = await api.get(REPORTS, { params: { report_id: id } })
  return toReport(data.Data ?? data)
}

export async function listReports() {
  const data = await api.get(REPORTS)
  return (data.Data ?? []).map(toReport)
}

// Waits until the server has built the PDF (checks every 3 s, up to 10 minutes).
export async function waitForReport(id, onTick) {
  for (let i = 0; i < 200; i++) {
    const r = await getReport(id)
    onTick?.(r)
    if (r.status !== 'processing') return r
    await new Promise((res) => setTimeout(res, 3000))
  }
  throw new Error('The PDF is taking too long. Check “Generated reports” again later.')
}

// Saves the PDF. Files on the API server are fetched with the login token; other links (e.g. signed S3) open directly.
export async function downloadReport(report) {
  const name = `${report.title.replace(/[^\w\- ]+/g, '').trim() || 'report'}.pdf`
  if (!report.url.startsWith(API_BASE)) return window.open(report.url, '_blank', 'noopener')
  const blob = await api.get(report.url.slice(API_BASE.length), { responseType: 'blob', timeout: 120000 })
  const href = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href, download: name }).click()
  URL.revokeObjectURL(href)
}
