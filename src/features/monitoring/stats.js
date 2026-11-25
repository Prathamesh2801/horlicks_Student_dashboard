// Dashboard numbers from a list of visits (already filtered).
// ponytail: computed in the browser from the full visit list; ask the server for a filtered stats endpoint
// (dashboard.php with date range / city / staff) if visit counts grow past a few thousand per period.
export function visitStats(visits, cities = []) {
  const students = visits.reduce((s, v) => s + (v.headcount ?? 0), 0)
  const schools = new Set(visits.map((v) => `${v.city}|${v.schoolName.trim().toLowerCase()}`)).size
  const perCity = Object.fromEntries(cities.map((c) => [c, 0]))
  visits.forEach((v) => (perCity[v.city] = (perCity[v.city] ?? 0) + 1))
  const counted = visits.filter((v) => v.headcount != null).length
  return {
    visits: visits.length,
    students,
    facesSeen: visits.reduce((s, v) => s + (v.facesSeen ?? 0), 0),
    schools,
    activeCities: Object.values(perCity).filter(Boolean).length,
    cityCount: Object.keys(perCity).length,
    perVisit: counted ? students / counted : null,
    perSchool: schools ? students / schools : null,
    byCity: Object.entries(perCity)
      .map(([city, n]) => ({ city, visits: n }))
      .sort((a, b) => b.visits - a.visits || a.city.localeCompare(b.city)),
  }
}

// Unique students per week (Mon–Sun), oldest first, for the trend chart.
export function weeklyStudents(visits) {
  const weeks = {}
  for (const v of visits) {
    const d = new Date(`${v.date}T00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // back to Monday
    const key = d.toLocaleDateString('en-CA')
    weeks[key] = (weeks[key] ?? 0) + (v.headcount ?? 0)
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, students]) => ({ week, students }))
}

// Photos the client may see from approved visits: headcount photos + normal photos set to "Show", ★ Best first.
export function sharedPhotos(visits, type = '') {
  const list = visits.flatMap((v) =>
    v.photos
      .filter((p) => p.show && (!type || (type === 'activity' ? p.type !== 'headcount' : p.type === 'headcount')))
      .map((p) => ({ ...p, visit: v })),
  )
  return list.sort((a, b) => b.best - a.best || b.visit.date.localeCompare(a.visit.date))
}
