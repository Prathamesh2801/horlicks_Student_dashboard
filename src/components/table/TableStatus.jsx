import { MdCloudOff, MdErrorOutline, MdSearchOff } from 'react-icons/md'
import { Button, EmptyState } from '../ui'

// Skeleton rows shown on the first load.
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-gray-100" aria-busy="true" aria-label="Loading">
      <div className="h-11 bg-page" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="size-8 shrink-0 rounded-full bg-gray-200" />
          <div className="h-3 flex-[2] rounded bg-gray-200" />
          <div className="hidden h-3 flex-1 rounded bg-gray-100 sm:block" />
          <div className="hidden h-3 flex-1 rounded bg-gray-100 md:block" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

// Thin animated bar on top of a table while it refreshes.
export function RefreshBar({ active }) {
  return (
    <div className="h-0.5 overflow-hidden bg-transparent">
      {active && <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-brand-500" />}
    </div>
  )
}

// First load failed (nothing to show).
export function LoadError({ message, onRetry }) {
  return (
    <EmptyState
      icon={MdCloudOff}
      title="Couldn’t load"
      text={message}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  )
}

// A refresh failed: keep showing the last data, say so.
export function StaleBanner({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
      <MdErrorOutline className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">Couldn’t refresh: {message} Showing the last loaded data.</span>
      <button type="button" onClick={onRetry} className="font-semibold underline">
        Retry
      </button>
    </div>
  )
}

// Nothing matches the search / filters.
export function NoResults({ onClear, text = 'Try a different search or clear the filters.' }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <MdSearchOff className="mb-2 size-10 text-brand-200" />
      <p className="font-semibold text-gray-800">No matches</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
      {onClear && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
