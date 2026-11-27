import { api } from './client'

// Server: Report/report.php (v1.12). Send visit IDs → a worker builds the PDF → Pdf_Url.
// Pdf_Url opens without login (the random token in it is the permission), so it can be shared as-is.
// The PDF follows the requester's role: an Admin's report has POC + all normal photos (approved or not).
const REPORTS = '/Report/report.php'
export const REPORT_MAX_VISITS = 50 // server .env REPORT_MAX_VISITS (default 50)

const STATUS_FROM = { Pending: 'waiting', Working: 'working', Done: 'ready', Failed: 'failed' }

const toReport = (r) => ({
  id: String(r.Report_ID),
  status: STATUS_FROM[r.Status] ?? 'waiting',
  visits: r.Visit_IDs?.length ?? null,
  skipped: r.Skipped_Visit_IDs ?? [],
  url: r.Pdf_Url ?? null,
  pages: r.Pages ?? null,
  size: r.File_Size ?? null,
  by: r.Requested_By ?? null,
  viewAs: r.View_As ?? null, // whose rules the PDF follows: Client (to share) or Admin (internal), v1.25
  error: r.Error ?? null,
  createdAt: r.Created_AT ? r.Created_AT.replace(' ', 'T') : null,
})

// visitIds in PDF order. Returns the queued report.
// asRole 'Client' (v1.25) = the client's version: approved visits/photos only, no POC or phone, no names.
export async function createReport(visitIds, asRole) {
  const data = await api.post(REPORTS, { visit_ids: visitIds.map(Number), ...(asRole ? { as_role: asRole } : {}) })
  return toReport(data.Data)
}

export async function getReport(id) {
  return toReport((await api.get(REPORTS, { params: { report_id: id } })).Data)
}

// Newest first (admins see everyone's).
export async function listReports() {
  return ((await api.get(REPORTS, { params: { limit: 50 } })).Data ?? []).map(toReport)
}

export async function retryReport(id) {
  return toReport((await api.put(REPORTS, { report_id: Number(id), retry: true })).Data ?? { Report_ID: id, Status: 'Pending' })
}

// Checks every 3 s until the worker is done (up to 10 minutes).
export async function waitForReport(id, onTick) {
  for (let i = 0; i < 200; i++) {
    const r = await getReport(id)
    onTick?.(r)
    if (r.status === 'ready' || r.status === 'failed') return r
    await new Promise((res) => setTimeout(res, 3000))
  }
  throw new Error('The PDF is taking long (is the report worker running?). Check “Generated reports” later.')
}
