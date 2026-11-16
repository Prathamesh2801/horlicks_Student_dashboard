// Fixed action bar at the bottom of the staff phone screens.
export default function BottomBar({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[900] border-t border-gray-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  )
}
