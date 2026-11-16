import { Link } from 'react-router'
import { MdArrowBack } from 'react-icons/md'

const backClass = '-ml-1 mt-0.5 rounded-lg p-1 text-gray-700 hover:bg-gray-200/60'

// Admin page title row. title can be a node (e.g. name + status badge). back = path or click handler.
export default function PageHeader({ title, subtitle, back, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start gap-3">
      {typeof back === 'function' ? (
        <button type="button" onClick={back} className={backClass} aria-label="Back">
          <MdArrowBack className="size-6" />
        </button>
      ) : (
        back && (
          <Link to={back} className={backClass} aria-label="Back">
            <MdArrowBack className="size-6" />
          </Link>
        )
      )}
      <div className="min-w-0 flex-1">
        <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
