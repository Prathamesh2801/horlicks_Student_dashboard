// Target status labels (the status itself comes from the server, see services/api/targets.service.js).
export const STATUS = {
  done: { label: 'Completed', tone: 'green' },
  'on-track': { label: 'On track', tone: 'green' },
  'at-risk': { label: 'At risk', tone: 'amber' },
  overdue: { label: 'Overdue', tone: 'red' },
  'not-started': { label: 'Not started', tone: 'gray' },
}
