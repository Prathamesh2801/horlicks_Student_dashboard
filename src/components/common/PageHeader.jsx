import { Link } from 'react-router'
import { MdArrowBack } from 'react-icons/md'

export default function PageHeader({ title, subtitle, back, action }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {back && (
        <Link to={back} className="-ml-1 mt-0.5 rounded-lg p-1 text-gray-600 hover:bg-gray-100" aria-label="Back">
          <MdArrowBack className="size-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
