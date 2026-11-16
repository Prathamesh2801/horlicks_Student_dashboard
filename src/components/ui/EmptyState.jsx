export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 size-10 text-brand-200" />}
      <p className="font-semibold text-gray-800">{title}</p>
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
