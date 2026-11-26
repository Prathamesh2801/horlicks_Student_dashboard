// Resize + re-encode as JPEG so uploads stay small on slow rural networks.
// stamp (optional): lines of text printed in a dark strip added BELOW the photo (geo-tag), so nothing in the
// photo is covered (the AI still sees every face).
export async function compressImage(file, { maxSize = 1600, quality = 0.75, stamp } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const font = Math.max(14, Math.round(w * 0.024))
  const strip = stamp?.length ? Math.round(stamp.length * font * 1.4 + font) : 0
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h + strip
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  if (strip) {
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, h, w, strip)
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'top'
    stamp.forEach((line, i) => {
      ctx.font = `${i === 0 ? 'bold ' : ''}${font}px sans-serif`
      ctx.fillText(line, font * 0.6, h + font * 0.5 + i * font * 1.4, w - font * 1.2)
    })
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))), 'image/jpeg', quality),
  )
}

// Geo-tag lines for a visit photo: where, when and which school.
export function geoStamp({ lat, lng, accuracy, fromVisit }, takenAt, draft, category) {
  const when = takenAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const where = lat == null ? 'Location not available' : `Lat ${lat.toFixed(6)}, Long ${lng.toFixed(6)}`
  const acc = lat != null && accuracy != null ? ` ±${accuracy} m` : ''
  return [
    `${where}${acc}${fromVisit ? ' (visit location)' : ''}`,
    `${category ? `${category} · ` : ''}${when} · ${draft.schoolName}, ${draft.city}`,
  ]
}
