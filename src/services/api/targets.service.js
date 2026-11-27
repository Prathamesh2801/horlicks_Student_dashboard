import { api } from './client'

// Server: Admin/target.php (see docs/SERVER_API.md → Admin · Targets). One visit target per district (v1.21), each with its
// own start and finish date. The server works out done, run-rate, needed rate, projected finish and status.
// Admins only (Clients and Staff get 403).
const TARGETS = '/Admin/target.php'

const STATUS_FROM = { 'On Track': 'on-track', 'At Risk': 'at-risk', Completed: 'done', Overdue: 'overdue', 'Not Started': 'not-started' }
const DAY = 86400000
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)

// Server progress (one city, or Overall) → app progress
function toProgress(t) {
  const dayNo = t.Days_Elapsed ?? 0
  const totalDays = t.Start_Date && t.Finish_Date ? daysBetween(t.Start_Date, t.Finish_Date) + 1 : null
  return {
    city: t.District ?? null, // the district (the app keeps the name `city`)
    target: t.Target,
    done: t.Done,
    remaining: t.Remaining ?? Math.max(t.Target - t.Done, 0),
    pct: (t.Percent_Done ?? 0) / 100,
    runRate: t.Run_Rate, // visits per day so far (null before the start date)
    needed: t.Needed_Rate, // visits per day needed from now (null when done or overdue)
    start: t.Start_Date,
    end: t.Finish_Date,
    finish: t.Projected_Finish_Date, // null when completed or nothing done yet
    lateDays: t.Projected_Finish_Date && t.Finish_Date ? Math.max(daysBetween(t.Finish_Date, t.Projected_Finish_Date), 0) : 0,
    dayNo: Math.min(dayNo, totalDays ?? dayNo),
    daysLeft: t.Days_Left ?? 0,
    totalDays,
    expected: totalDays ? Math.round((t.Target * Math.min(dayNo, totalDays)) / totalDays) : 0, // where we'd be on an even pace
    status: STATUS_FROM[t.Status] ?? 'at-risk',
    updatedBy: t.Updated_By ?? null,
  }
}

// { asOf, overall (null when no city has a target), byCity: [...] }
export async function getTargets() {
  const data = await api.get(TARGETS)
  return { asOf: data.As_Of, overall: data.Overall ? toProgress(data.Overall) : null, byCity: (data.Districts ?? []).map(toProgress) }
}

// Create (exists = false) or change a city's target. target = { visits, start, end } (dates YYYY-MM-DD).
export async function saveCityTarget(city, { visits, start, end }, exists) {
  const body = { district: city, target_visits: Number(visits), start_date: start, finish_date: end }
  return exists ? api.put(TARGETS, body) : api.post(TARGETS, body)
}

export const removeCityTarget = (city) => api.delete(TARGETS, { params: { district: city } })
