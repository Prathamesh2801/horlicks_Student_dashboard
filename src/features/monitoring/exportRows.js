import { REVIEW } from '../../constants/visit'

// Excel / CSV rows ([header, ...rows]) for the Visits and Reports pages.

export const visitRows = (visits) => [
  // prettier-ignore
  ['Visit ID', 'Date', 'School', 'District', 'City', 'Village', 'UDISE code', 'School type', 'Class category', 'Ground Team', 'POC name', 'POC contact',
    'Review', 'Photos', 'Students covered (entered)', 'Unique students (AI)', 'Faces (incl. repeats)', 'AI photos failed', 'Latitude', 'Longitude', 'Uploaded'],
  ...visits.map((v) => [
    v.id, v.date, v.schoolName, v.district, v.cityName, v.village, v.udise, v.schoolType, v.classCategory, v.staffName, v.pocName, v.pocContact,
    REVIEW[v.review]?.label, v.photoCount, v.studentsCovered, v.headcount, v.facesSeen, v.aiFailed, v.lat, v.lng, v.submittedAt,
  ]),
]

// Full link (Excel needs absolute URLs; photos through the proxy are relative).
const absolute = (url) => (url ? new URL(url, window.location.href).href : '')

// One row per photo with a clickable link and its GPS (the photo's own, else the visit's).
// ponytail: S3 links from the server are temporary signed URLs, so links in an old export can stop working.
export const photoRows = (visits) => [
  // prettier-ignore
  ['Visit ID', 'Date', 'School', 'District', 'City', 'Photo', 'Category', 'Shown to client', '★ Best', 'Photo link', 'Latitude', 'Longitude', 'GPS from'],
  ...visits.flatMap((v) =>
    v.photos.map((p) => {
      const own = p.lat != null
      return [
        v.id, v.date, v.schoolName, v.district, v.cityName, p.type === 'headcount' ? 'Headcount (AI)' : 'Normal', p.category,
        p.show ? 'Yes' : 'No', p.best ? 'Yes' : '', { link: absolute(p.url), text: 'Open photo' },
        own ? p.lat : v.lat, own ? p.lng : v.lng, own ? 'Photo' : 'Visit',
      ]
    }),
  ),
]
