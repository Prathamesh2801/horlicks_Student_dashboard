import { useId } from 'react'

export const fieldClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100'

export const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-800'

// icon = leading icon component, suffix = element pinned to the right (e.g. show-password button)
// error = a problem with the value: shown in red under the field (instead of the hint)
export default function Input({ label, hint, error, icon: Icon, suffix, className = '', ...props }) {
  const id = useId()
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={`${fieldClass} ${Icon ? 'pl-10' : ''} ${suffix ? 'pr-12' : ''} ${error ? '!border-red-500 focus:!ring-red-100' : ''}`}
          {...props}
        />
        {suffix && <div className="absolute inset-y-0 right-1.5 flex items-center">{suffix}</div>}
      </div>
      {error ? (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}
