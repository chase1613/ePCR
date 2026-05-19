import { Navigate, Outlet } from 'react-router-dom'

export default function UserRoutes() {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))

  if (!token || !user) return <Navigate to="/login" replace />
  if (user.role !== 'user') return <Navigate to="/admin/dashboard" replace />

  return <Outlet />
}