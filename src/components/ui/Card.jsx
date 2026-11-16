export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}
