import { useNavigate } from 'react-router-dom'
import './Sidebar.css'
import { useHeartbeat } from '../../hooks/useHeartbeat'


const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
  { key: 'pcr',       label: 'My PCR',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 6h8M4 9h6M4 12h4"/><rect x="1" y="2" width="14" height="13" rx="1.5"/></svg> },
  { key: 'create',    label: 'Create PCR',icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M8 3v10M3 8h10"/></svg> },
  { key: 'profile',   label: 'Profile',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.5 2.5-6 6-6s6 2.5 6 6"/></svg> },
]

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

export default function UserLayout({ tab, setTab, children }) {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('user'))
  useHeartbeat() 

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo">
            <img src="/sbar-logo.png" alt="ePCR Logo" className="sb-logo-img" />
            <div>
              <div className="sb-logo-text">ePCR</div>
              <div className="sb-logo-sub">Civil Service Commission</div>
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-label">Menu</div>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${tab === n.key ? 'active' : ''}`}
              onClick={() => setTab(n.key)}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{getInitials(user?.name)}</div>
            <div className="sb-user-info">
              <div className="sb-user-name" title={user?.name || 'Employee'}>
                {user?.name || 'Employee'}
              </div>
              <span className="sb-user-role">Employee</span>
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

      <main className="main">
        {children}
      </main>
    </div>
  )
}