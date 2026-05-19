import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A'

  const navLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
      ),
    },
    {
      to: '/admin/manage-users',
      label: 'Manage users',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="6" cy="5" r="3"/>
          <path d="M1 13c0-3 2-5 5-5s5 2 5 5"/>
          <path d="M11 2c1.5.5 2.5 2 2.5 3.5S12.5 8.5 11 9"/>
          <path d="M13 11c1.5.5 2.5 1.5 2.5 3"/>
        </svg>
      ),
    },
    {
      to: '/admin/reviews',
      label: 'Reviews',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M4 6h8M4 9h6M4 12h4"/>
          <rect x="1" y="2" width="14" height="13" rx="1.5"/>
        </svg>
      ),
    },
    {
      to: '/admin/reports',
      label: 'Reports',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2 12l3-4 3 2 3-5 3 3"/>
          <rect x="1" y="1" width="14" height="14" rx="1.5"/>
        </svg>
      ),
    },
  ]

  return (
    <aside className="sidebar">

      {/* ── Brand ── */}
      <div className="sb-brand">
        <div className="sb-logo">
          <img
            src="/sbar-logo.png"
            alt="ePCR Logo"
            className="sb-logo-img"
          />
          <div>
            <div className="sb-logo-text">eIPCR</div>
            <div className="sb-logo-sub">Civil Service Commission</div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sb-nav">
        <div className="sb-label">MENU</div>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-item ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.name || 'Admin'}</div>
            <span className="sb-user-role">Admin</span>
          </div>
        </div>
        <button className="sb-logout" onClick={handleLogout}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 2H2v12h4M10 11l4-3-4-3M6 8h8"/>
          </svg>
          Log out
        </button>
      </div>

    </aside>
  )
}