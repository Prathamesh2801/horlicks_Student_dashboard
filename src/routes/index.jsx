import { createHashRouter, Navigate } from 'react-router'
import { RequireRole } from '../features/auth'
import AdminLayout, { ClientLayout } from '../layouts/AdminLayout'
import StaffLayout from '../layouts/StaffLayout'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import SharedReportPage from '../pages/SharedReportPage'
import ClientMapPage from '../pages/client/ClientMapPage'
import ClientOverviewPage from '../pages/client/ClientOverviewPage'
import ClientVisitDetailPage from '../pages/client/ClientVisitDetailPage'
import ClientVisitsPage from '../pages/client/ClientVisitsPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MapPage from '../pages/admin/MapPage'
import ReportsPage from '../pages/admin/ReportsPage'
import TargetPage from '../pages/admin/TargetPage'
import UsersPage from '../pages/admin/UsersPage'
import VisitDetailPage from '../pages/admin/VisitDetailPage'
import VisitsPage from '../pages/admin/VisitsPage'
import MyVisitsPage from '../pages/staff/MyVisitsPage'
import NewVisitPage from '../pages/staff/NewVisitPage'
import VisitPhotosPage from '../pages/staff/VisitPhotosPage'
import VisitSummaryPage from '../pages/staff/VisitSummaryPage'

export const router = createHashRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/staff',
    element: (
      <RequireRole role="staff">
        <StaffLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <MyVisitsPage /> },
      { path: 'visits/new', element: <NewVisitPage /> },
      { path: 'drafts/:id', element: <VisitPhotosPage /> },
      { path: 'visits/:id', element: <VisitSummaryPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireRole role="admin">
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'visits', element: <VisitsPage /> },
      { path: 'visits/:id', element: <VisitDetailPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'target', element: <TargetPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
  {
    // Read-only client view; admins can open it as a preview.
    path: '/client',
    element: (
      <RequireRole role={['client', 'admin']}>
        <ClientLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <ClientOverviewPage /> },
      { path: 'visits', element: <ClientVisitsPage /> },
      { path: 'visits/:id', element: <ClientVisitDetailPage /> },
      { path: 'map', element: <ClientMapPage /> },
    ],
  },
  // Shared report link (no login).
  { path: '/r/:id', element: <SharedReportPage /> },
  { path: '*', element: <NotFoundPage /> },
])
