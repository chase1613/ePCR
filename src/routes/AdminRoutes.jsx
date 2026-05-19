import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoutes() {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))

  if (!token || !user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/user/dashboard" replace />

  return <Outlet />
}