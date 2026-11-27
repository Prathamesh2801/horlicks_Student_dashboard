// Which brand the app shows: logo, names, app icons, install name and page title all follow this one object.
// Placeholder until the client confirms we may use their name and logo. To switch, replace the object below with:
//   { id: 'horlicks', company: 'Horlicks', fullName: 'Horlicks School Activity' }
// then rebuild. Assets per brand: src/assets/brand/<id>-logo.svg + <id>-logo-white.svg, and public/brand/<id>/ icons.
// Only the active brand's files are built and served.
const active = { id: 'horlicks', company: 'Horlicks', fullName: 'Horlicks School Activity' }

export const brand = { ...active, icons: `brand/${active.id}/` }
