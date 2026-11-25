import { todayISO } from '../../utils/format'

// Campaign target maths (counts are approved visits). Dates are 'YYYY-MM-DD'.
const DAY = 86400000
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)
const addDays = (iso, n) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10)

export const STATUS = {
  done: { label: 'Target met', tone: 'green' },
  'on-track': { label: 'On track', tone: 'green' },
  'at-risk': { label: 'At risk', tone: 'amber' },
  behind: { label: 'Behind', tone: 'red' },
}

// { done, target, pct, runRate, needed, finish, dayNo, totalDays, expected, status }
//   runRate = done ÷ days gone · needed = left ÷ days left · finish = today + left ÷ runRate
//   status: finish by the end date = on track, up to 2 days late = at risk, later (or no visits yet) = behind
export function progress(done, target, { start, end }, today = todayISO()) {
  const totalDays = days(start, end) + 1
  const dayNo = Math.min(Math.max(days(start, today) + 1, 0), totalDays)
  const left = Math.max(target - done, 0)
  const daysLeft = totalDays - dayNo
  const runRate = dayNo ? done / dayNo : 0
  const needed = left ? (daysLeft ? left / daysLeft : left) : 0
  const finish = !left ? today : runRate ? addDays(today, Math.ceil(left / runRate)) : null
  const late = finish ? days(end, finish) : Infinity
  const status = !left ? 'done' : dayNo === 0 ? 'on-track' : late <= 0 ? 'on-track' : late <= 2 ? 'at-risk' : 'behind'
  return {
    done,
    target,
    pct: target ? done / target : 0,
    runRate,
    needed,
    finish,
    lateDays: Math.max(late, 0),
    dayNo,
    totalDays,
    expected: Math.round((target * dayNo) / totalDays),
    status,
  }
}

// Overall + per-city progress from approved visits inside the campaign dates.
export function campaignProgress(target, visits, today = todayISO()) {
  if (!target) return null
  const inCampaign = visits.filter((v) => v.review === 'approved' && v.date >= target.start && v.date <= target.end)
  const byCity = Object.entries(target.cities)
    .filter(([, t]) => t > 0)
    .map(([city, t]) => ({ city, ...progress(inCampaign.filter((v) => v.city === city).length, t, target, today) }))
  const total = byCity.reduce((s, c) => s + c.target, 0)
  return { overall: progress(inCampaign.length, total, target, today), byCity, start: target.start, end: target.end }
}

// demo(): node -e "import('./src/features/monitoring/target.js').then(m => m.demo())"
export function demo() {
  const c = { start: '2026-11-01', end: '2026-12-15' }
  const p = progress(3980, 8000, c, '2026-11-23')
  console.assert(p.dayNo === 23 && p.totalDays === 45, 'day counting')
  console.assert(Math.round(p.runRate) === 173 && Math.round(p.needed) === 183, 'rates')
  console.assert(p.finish === '2026-12-17' && p.status === 'at-risk', `finish ${p.finish} ${p.status}`)
  console.assert(progress(8000, 8000, c, '2026-11-23').status === 'done', 'done')
  console.assert(progress(0, 100, c, '2026-11-10').status === 'behind', 'no visits yet = behind')
  console.log('target.js ok')
}
