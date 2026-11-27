import { api } from './client'

// Server: Admin/visit_form.php. Admin turns three things on / off for the Ground Team:
// POC name, Contact number (on = shown and required, off = hidden) and the Upload button.
// Staff phones read it (cached for offline drafts).
const FORM = '/Admin/visit_form.php'
const CACHE = 'visit-form-settings'

export const DEFAULT_SETTINGS = { poc_name: true, poc_contact: true, upload_button: true }

const cached = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE)) ?? null
  } catch {
    return null
  }
}

// { settings: { poc_name, poc_contact, upload_button }, updatedBy, updatedAt }. Offline: the last copy, else all on.
export async function getFormSettings() {
  try {
    const data = (await api.get(FORM)).Data
    const shown = (name) => data.Fields?.find((f) => f.Name === name)?.Show ?? true
    const settings = { poc_name: shown('poc_name'), poc_contact: shown('poc_contact'), upload_button: data.Upload_Button?.Show ?? true }
    try {
      localStorage.setItem(CACHE, JSON.stringify(settings))
    } catch {
      // storage blocked
    }
    return { settings, updatedBy: data.Updated_By ?? null, updatedAt: data.Updated_AT ? data.Updated_AT.replace(' ', 'T') : null }
  } catch {
    const c = cached()
    return { settings: { ...DEFAULT_SETTINGS, ...(c && 'poc_name' in c ? c : {}) }, offline: true }
  }
}

export async function saveFormSettings({ poc_name, poc_contact, upload_button }) {
  await api.put(FORM, {
    fields: { poc_name: { show: poc_name, required: poc_name }, poc_contact: { show: poc_contact, required: poc_contact } },
    upload_button: { show: upload_button },
  })
}
