import { useId } from 'react'
import { fieldClass, labelClass } from './Input'

export default function Select({ label, hint, options, placeholder, className = '', ...props }) {
  const id = useId()
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <select id={id} className={fieldClass} {...props}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
