import { api } from './client'

// Server: Admin/settings.php (not on the server yet; contract in docs/SERVER_API.md → "Form settings").
// Admin decides whether the POC name and Contact number fields are shown on the Ground Team form, and whether
// each is required. Staff read it (cached on the phone for offline drafts).
const SETTINGS = '/Admin/settings.php'
const CACHE = 'form-settings'

// Today's behaviour: both shown and required.
export const DEFAULT_FORM = { poc: { show: true, required: true }, contact: { show: true, required: true } }

const fromServer = (d) => ({
  poc: { show: d.Poc_Name_Show ?? true, required: d.Poc_Name_Required ?? true },
  contact: { show: d.Poc_Contact_Show ?? true, required: d.Poc_Contact_Required ?? true },
})
const cached = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE)) ?? null
  } catch {
    return null
  }
}

// { form, onServer }. onServer = false while the endpoint doesn't exist (the defaults apply).
export async function getFormSettings() {
  try {
    const form = fromServer((await api.get(SETTINGS)).Data ?? {})
    try {
      localStorage.setItem(CACHE, JSON.stringify(form))
    } catch {
      // storage blocked
    }
    return { form, onServer: true }
  } catch (err) {
    if (err.status === 404) return { form: DEFAULT_FORM, onServer: false }
    return { form: cached() ?? DEFAULT_FORM, onServer: true } // offline: last known settings
  }
}

export async function saveFormSettings({ poc, contact }) {
  await api.put(SETTINGS, {
    poc_name_show: poc.show,
    poc_name_required: poc.show && poc.required,
    poc_contact_show: contact.show,
    poc_contact_required: contact.show && contact.required,
  })
}
