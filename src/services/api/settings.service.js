import { api } from './client'

// Server: Admin/visit_form.php (v1.14). GET (Admin, Staff) describes the Create-visit form; PUT (Admin) switches
// these fields between required, optional and hidden. Staff phones cache it for offline drafts.
const FORM = '/Admin/visit_form.php'
const CACHE = 'visit-form-settings'

// Fields an Admin can switch (server names), in form order.
export const SWITCHABLE = [
  ['district', 'District'],
  ['village', 'Village'],
  ['udise', 'UDISE code'],
  ['school_type', 'School type'],
  ['class_category', 'Class category'],
  ['poc_name', 'POC name'],
  ['poc_contact', 'Contact number'],
  ['start_time', 'Visit start time'],
]

// Server default: everything shown and required.
export const DEFAULT_FORM = Object.fromEntries(SWITCHABLE.map(([name]) => [name, { show: true, required: true }]))

const cached = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE)) ?? null
  } catch {
    return null
  }
}

// { form: { district: { show, required }, ... }, updatedBy, updatedAt }. Offline: the last copy, else the defaults.
export async function getFormSettings() {
  try {
    const data = (await api.get(FORM)).Data
    const byName = Object.fromEntries((data.Fields ?? []).map((f) => [f.Name, f]))
    const form = Object.fromEntries(
      SWITCHABLE.map(([name]) => [name, { show: byName[name]?.Show ?? true, required: byName[name]?.Required ?? true }]),
    )
    try {
      localStorage.setItem(CACHE, JSON.stringify(form))
    } catch {
      // storage blocked
    }
    return { form, updatedBy: data.Updated_By ?? null, updatedAt: data.Updated_AT ? data.Updated_AT.replace(' ', 'T') : null }
  } catch {
    return { form: cached() ?? DEFAULT_FORM, offline: true }
  }
}

// changes: { district: { show, required }, ... } (only what changed). Hidden also means not required.
export async function saveFormSettings(changes) {
  const fields = Object.fromEntries(Object.entries(changes).map(([name, f]) => [name, { show: f.show, required: f.show && f.required }]))
  await api.put(FORM, { fields })
}
