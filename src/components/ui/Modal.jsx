import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MdClose } from 'react-icons/md'

export default function Modal({ open, title, subtitle, onClose, wide, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1200] flex items-end justify-center bg-gray-900/50 p-3 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`max-h-[92dvh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6 ${wide ? 'max-w-3xl' : 'max-w-md'}`}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="-mr-1 rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <MdClose className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
