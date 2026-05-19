import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'


// Auth
import LoginPage from './pages/auth/LoginPage'
import ForgotPassword from './pages/auth/ForgotPassword'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageUsers from './pages/admin/ManageUsers'
import Reviews from './pages/admin/Reviews'
import Reports from './pages/admin/Reports'

// User pages
import UserDashboard from './pages/user/Dashboard'
import MyCreatePCR from './pages/user/CreatePCR'
import MyUserProfile from './pages/user/UserProfile'
import MyUserPCR from './pages/user/MyPCR'

// Protected route layouts
import AdminRoutes from './routes/AdminRoutes'
import UserRoutes from './routes/UserRoutes'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin protected routes */}
        <Route element={<AdminRoutes />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/reviews" element={<Reviews />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>

        {/* User protected routes */}
        <Route element={<UserRoutes />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/my-commitments" element={<MyCreatePCR />} />
          <Route path="/user/my-reviews" element={<MyUserProfile />} />
          <Route path="/user/my-pcr" element={<MyUserPCR />} />
        </Route>

        {/* Fallback — redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App


