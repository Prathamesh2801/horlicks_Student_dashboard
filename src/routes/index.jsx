import { createHashRouter, Navigate } from 'react-router'
import { RequireRole } from '../features/auth'
import AdminLayout from '../layouts/AdminLayout'
import StaffLayout from '../layouts/StaffLayout'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MapPage from '../pages/admin/MapPage'
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
      { path: 'visits/:id/photos', element: <VisitPhotosPage /> },
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
