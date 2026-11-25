import { useEffect, useRef, useState } from 'react'
import { MdArrowDropDown, MdDownload } from 'react-icons/md'
import { Button } from '../ui'
import { downloadCsv } from '../../utils/downloadCsv'
import { downloadXlsx } from '../../utils/downloadXlsx'

// "Export ▾" with Excel (.xlsx) and CSV. getRows() returns [header, ...rows] for what is shown (current filters).
export default function ExportMenu({ filename, getRows, count, noun = 'rows', disabled }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const run = async (kind) => {
    setOpen(false)
    setBusy(true)
    try {
      if (kind === 'xlsx') await downloadXlsx(`${filename}.xlsx`, getRows())
      else downloadCsv(`${filename}.csv`, getRows())
    } finally {
      setBusy(false)
    }
  }

  const item = (kind, title, text) => (
    <button type="button" role="menuitem" onClick={() => run(kind)} className="block w-full px-4 py-2.5 text-left hover:bg-brand-50">
      <span className="block text-sm font-semibold text-gray-900">{title}</span>
      <span className="block text-xs text-gray-500">{text}</span>
    </button>
  )

  return (
    <div ref={ref} className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        loading={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MdDownload className="size-5" /> Export <MdArrowDropDown className="-ml-1 size-5" />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
          {item('xlsx', 'Excel (.xlsx)', 'Formatted sheet, one row per visit')}
          <div className="border-t border-gray-100" />
          {item('csv', 'CSV (.csv)', 'Plain data for any tool')}
          <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
            Exports the {count?.toLocaleString('en-IN')} {noun} that match your filters
          </p>
        </div>
      )}
    </div>
  )
}
