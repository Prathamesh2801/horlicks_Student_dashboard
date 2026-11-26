// Real Excel file. sheets: [{ name, rows }] where rows = [header, ...rows] (header shown bold).
// A cell { link, text } becomes a clickable link. The library is loaded only when someone exports.
export async function downloadXlsx(filename, sheets) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const cell = (v) => {
    if (v === '' || v == null) return null
    if (typeof v === 'object' && 'link' in v) {
      if (!v.link) return null
      const q = (s) => s.replace(/"/g, '""')
      return { type: 'Formula', value: `HYPERLINK("${q(v.link)}","${q(v.text)}")`, color: '#1d4ed8', textDecoration: { underline: true } }
    }
    return v
  }
  const width = (v) => String(v && typeof v === 'object' ? v.text : (v ?? '')).length + 2
  await writeExcelFile(
    sheets.map(({ name, rows }) => {
      const [header, ...body] = rows
      return {
        sheet: name,
        data: [header.map((value) => ({ value, fontWeight: 'bold' })), ...body.map((r) => r.map(cell))],
        columns: header.map((_, i) => ({ width: Math.min(40, Math.max(10, ...rows.map((r) => width(r[i])))) })),
        stickyRowsCount: 1,
      }
    }),
  ).toFile(filename)
}
