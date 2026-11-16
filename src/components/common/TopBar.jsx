import { Link } from 'react-router'
import { MdArrowBack } from 'react-icons/md'

// Sticky app bar for the staff phone screens.
export default function TopBar({ title, subtitle, back, action }) {
  return (
    <header className="sticky top-0 z-[900] -mx-4 mb-4 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
      {back && (
        <Link to={back} className="-ml-1 rounded-lg p-1 text-gray-800 hover:bg-gray-100" aria-label="Back">
          <MdArrowBack className="size-6" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-bold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
