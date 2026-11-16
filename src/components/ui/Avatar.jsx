import { initials } from '../../utils/format'

export default function Avatar({ name, className = 'bg-brand-100 text-brand-700' }) {
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${className}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
