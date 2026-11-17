import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router'
import { startUploadQueue } from '../services/drafts/uploadQueue'

// Phone-first column. Each page renders its own TopBar / BottomBar.
export default function StaffLayout() {
  const { pathname } = useLocation()

  // Upload visits that were submitted without internet (on start, when back online, every minute).
  useEffect(() => startUploadQueue(), [])

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="mx-auto min-h-dvh max-w-md bg-page px-4 pb-32"
    >
      <Outlet />
    </motion.main>
  )
}
