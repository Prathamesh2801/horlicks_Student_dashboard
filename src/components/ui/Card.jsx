// Callers set the padding (p-4, p-5, p-0 for tables).
export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-gray-200/80 ${className}`} {...props}>
      {children}
    </div>
  )
}
