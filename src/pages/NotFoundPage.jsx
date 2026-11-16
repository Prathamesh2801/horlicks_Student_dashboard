import { Link } from 'react-router'
import { MdSearchOff } from 'react-icons/md'
import { EmptyState } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={MdSearchOff}
        title="Page not found"
        text="The page you opened does not exist."
        action={
          <Link to="/" className="text-sm font-medium text-brand-600">
            Go home
          </Link>
        }
      />
    </div>
  )
}
