// Real Excel file from the same rows as downloadCsv (first row = header, shown bold).
// The library is loaded only when someone exports.
export async function downloadXlsx(filename, rows, sheet = 'Sheet1') {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const [header, ...body] = rows
  const data = [
    header.map((value) => ({ value, fontWeight: 'bold' })),
    ...body.map((r) => r.map((v) => (v === '' || v == null ? null : v))),
  ]
  const columns = header.map((_, i) => ({ width: Math.min(40, Math.max(10, ...rows.map((r) => String(r[i] ?? '').length + 2))) }))
  await writeExcelFile(data, { columns, sheet, stickyRowsCount: 1 }).toFile(filename)
}
