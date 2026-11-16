// Opens in Excel. Cells starting with = + - @ are prefixed so a typed school name can't run as a formula.
export function downloadCsv(filename, rows) {
  const cell = (v) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return `"${s.replaceAll('"', '""')}"`
  }
  const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
