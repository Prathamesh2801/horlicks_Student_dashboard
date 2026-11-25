// Sort values for useTableState (keys match the SortHeader fields in VisitsTable).
export const VISIT_SORT = {
  date: (v) => `${v.date} ${v.submittedAt ?? ''}`,
  school: (v) => v.schoolName,
  city: (v) => v.cityName,
  staff: (v) => v.staffName,
  photos: (v) => v.photoCount,
  count: (v) => v.headcount,
  ai: (v) => v.aiFailed,
  review: (v) => v.review,
}
