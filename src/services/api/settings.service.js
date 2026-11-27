import { api } from './client'

// Server: Admin/visit_form.php (v1.14). GET (Admin, Staff) describes the Create-visit form; PUT (Admin) switches
// these fields between required, optional and hidden. Staff phones cache it for offline drafts.
const FORM = '/Admin/visit_form.php'
const CACHE = 'visit-form-settings'

// Fields an Admin can switch (server names), in form order. District is always required (v1.21).
export const SWITCHABLE = [
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

// { form: { village: { show, required }, ... }, uploadButton, updatedBy, updatedAt }. Offline: the last copy, else the defaults.
// uploadButton (v1.20): whether the Ground Team sees the Upload (choose from gallery) button. Default shown.
export async function getFormSettings() {
  try {
    const data = (await api.get(FORM)).Data
    const byName = Object.fromEntries((data.Fields ?? []).map((f) => [f.Name, f]))
    const form = Object.fromEntries(
      SWITCHABLE.map(([name]) => [name, { show: byName[name]?.Show ?? true, required: byName[name]?.Required ?? true }]),
    )
    const uploadButton = data.Upload_Button?.Show ?? true
    try {
      localStorage.setItem(CACHE, JSON.stringify({ form, uploadButton }))
    } catch {
      // storage blocked
    }
    return { form, uploadButton, updatedBy: data.Updated_By ?? null, updatedAt: data.Updated_AT ? data.Updated_AT.replace(' ', 'T') : null }
  } catch {
    const c = cached()
    return { form: c?.form ?? DEFAULT_FORM, uploadButton: c?.uploadButton ?? true, offline: true }
  }
}

// changes: { village: { show, required }, ... } (only what changed; hidden also means not required).
// uploadButton: true / false, or undefined to leave it as it is.
export async function saveFormSettings(changes, uploadButton) {
  const fields = Object.fromEntries(Object.entries(changes).map(([name, f]) => [name, { show: f.show, required: f.show && f.required }]))
  await api.put(FORM, {
    ...(Object.keys(fields).length ? { fields } : {}),
    ...(uploadButton === undefined ? {} : { upload_button: { show: uploadButton } }),
  })
}
