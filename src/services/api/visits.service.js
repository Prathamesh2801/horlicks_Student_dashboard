// Visits, photos, AI headcount and dashboard stats.
// The server (API v1.1.1) has no endpoints for these yet, so they run on in-browser sample data.
// When they are added, replace each export with a real call, the same way as users.service.js.
export {
  createVisit,
  listVisits,
  getVisit,
  uploadPhoto,
  deletePhoto,
  submitVisit,
  getStats,
} from './mock/visits.mock'
