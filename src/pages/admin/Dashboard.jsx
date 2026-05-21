import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Sidebar from '../../components/layout/Sidebar'
import './Dashboard.css'

const API    = import.meta.env.VITE_API_URL
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const avatarColors = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FAECE7', color: '#712B13' },
]

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

const getColor = (id) => avatarColors[id % avatarColors.length]

const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth()
const YEARS        = [currentYear - 1, currentYear, currentYear + 1]

// ── Fetcher function ──
const fetchEmployees = async (token) => {
  const { data } = await axios.get(`${API}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear,  setSelectedYear]  = useState(currentYear)

  useEffect(() => {
      document.title = 'Dashboard | ePCR'
      return () => { document.title = 'ePCR' }
    }, [])

  // ── TanStack Query ──
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['employees'],
    queryFn:  () => fetchEmployees(token),
  })

  // ── Derived stats ──
  const totalEmployees  = employees.length
  const activeEmployees = employees.filter((e) => e.is_active).length
  const totalAdmins     = employees.filter((e) => e.role === 'admin').length
  const inactiveCount   = totalEmployees - activeEmployees
  const registeredThisYear = employees.filter(
    (e) => new Date(e.created_at).getFullYear() === currentYear
  ).length

  // ── Top 10 recent ──
  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  // ── Monthly registrations for selected month/year ──
  const monthlyCount = employees.filter((e) => {
    const d = new Date(e.created_at)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  // ── Bar chart: all 12 months for selected year ──
  const monthlyData = MONTHS.map((month, i) => ({
    month: month.slice(0, 3),
    count: employees.filter((e) => {
      const d = new Date(e.created_at)
      return d.getMonth() === i && d.getFullYear() === selectedYear
    }).length,
  }))
  const maxCount = Math.max(...monthlyData.map((m) => m.count), 1)

  // ── Loading state ──
    if (isLoading) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="main">

          {/* Header */}
          <div className="main-header">
            <div>
              <div className="skeleton skeleton-text--lg" style={{ width: 140 }} />
              <div className="skeleton skeleton-text--sm" style={{ width: 200, marginTop: 6 }} />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton skeleton-text--sm" style={{ width: '50%' }} />
                <div className="skeleton skeleton-text--lg" style={{ width: '30%', marginTop: 8 }} />
                <div className="skeleton skeleton-text--xs" style={{ width: '60%', marginTop: 6 }} />
              </div>
            ))}
          </div>

          {/* Mid Grid */}
          <div className="mid-grid">

            {/* Recent Employees skeleton */}
            <div className="skeleton-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="skeleton skeleton-text--sm" style={{ width: 140 }} />
                <div className="skeleton skeleton-text--sm" style={{ width: 50 }} />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="skeleton-row" key={i}>
                  <div className="skeleton" style={{ width: 16, height: 12, borderRadius: 4 }} />
                  <div className="skeleton skeleton-avatar" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text--full" style={{ marginBottom: 4 }} />
                    <div className="skeleton skeleton-text--half" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="skeleton skeleton-text--sm" style={{ width: 50 }} />
                    <div className="skeleton skeleton-text--xs" style={{ width: 70 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Chart skeleton */}
            <div className="skeleton-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="skeleton skeleton-text--sm" style={{ width: 160 }} />
                <div className="skeleton skeleton-text--sm" style={{ width: 60 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 16 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ flex: 1, height: `${Math.random() * 60 + 20}%`, borderRadius: '4px 4px 0 0' }}
                  />
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <div className="skeleton skeleton-text--sm" style={{ width: 100, marginBottom: 12 }} />
                <div className="skeleton skeleton-text--lg" style={{ width: 60, marginBottom: 8 }} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="skeleton-row" key={i}>
                    <div className="skeleton skeleton-avatar" style={{ width: 28, height: 28 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text--full" style={{ marginBottom: 4 }} />
                      <div className="skeleton skeleton-text--half" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Mini Stats */}
          <div className="bottom-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton skeleton-text--sm" style={{ width: '50%' }} />
                <div className="skeleton skeleton-text--lg" style={{ width: '40%', marginTop: 8 }} />
                <div className="skeleton skeleton-text--xs" style={{ width: '60%', marginTop: 6 }} />
              </div>
            ))}
          </div>

        </main>
      </div>
    )
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="main">
          <div className="main-header">
            <div>
              <h1 className="main-title">Dashboard</h1>
              <p className="page-sub">Employee analytics overview</p>
            </div>
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: '#c0392b' }}>
            Failed to load dashboard data: {error?.message}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">

        {/* ── Header ── */}
        <div className="main-header">
          <div>
            <h1 className="main-title">Dashboard</h1>
            <p className="page-sub">Employee analytics overview</p>
          </div>
          <div className="main-date">{currentYear} · Overview</div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total employees</div>
            <div className="stat-value">{totalEmployees}</div>
            <div className="stat-sub">All registered accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active employees</div>
            <div className="stat-value" style={{ color: '#085041' }}>{activeEmployees}</div>
            <div className="stat-sub">Currently active</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total admins</div>
            <div className="stat-value" style={{ color: '#185FA5' }}>{totalAdmins}</div>
            <div className="stat-sub">Admin accounts</div>
          </div>
        </div>

        {/* ── Mid Grid: Recent Employees + Monthly Chart ── */}
        <div className="mid-grid">

          {/* Recent Employees */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                Recent employees <span className="card-title-sub">Top 10</span>
              </div>
              <button className="card-action" onClick={() => navigate('/admin/manage-users')}>
                See all 
              </button>
            </div>
            <div className="recent-list">
              {recentEmployees.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No employees yet.
                </div>
              ) : (
                recentEmployees.map((emp, idx) => {
                  const c = getColor(emp.id)
                  return (
                    <div className="user-row" key={emp.id}>
                      <div className="rank-num">{idx + 1}</div>
                      <div className="u-avatar" style={{ background: c.bg, color: c.color }}>
                        {getInitials(emp.name)}
                      </div>
                      <div className="u-info">
                        <div className="u-name">{emp.name}</div>
                        <div className="u-dept">{emp.department || '—'} · {emp.position || '—'}</div>
                      </div>
                      <div className="u-meta">
                        <span className={`u-badge ${emp.is_active ? 'badge-employee' : 'badge-inactive'}`}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="u-date">
                          {new Date(emp.created_at).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Monthly Registrations Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Monthly Registrations</div>
              <select
                className="filter-select filter-select--sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(+e.target.value)}
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Bar chart */}
            <div className="bar-chart">
              {monthlyData.map((m) => (
                <div
                  key={m.month}
                  className={`bar-chart__col ${m.month === MONTHS[selectedMonth].slice(0, 3) ? 'bar-chart__col--active' : ''}`}
                  onClick={() => setSelectedMonth(MONTHS.findIndex((mo) => mo.slice(0, 3) === m.month))}
                >
                  <div className="bar-chart__val">{m.count > 0 ? m.count : ''}</div>
                  <div
                    className="bar-chart__bar"
                    style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 8 : 0)}%` }}
                  />
                  <div className="bar-chart__label">{m.month}</div>
                </div>
              ))}
            </div>

            {/* Month detail */}
            <div className="month-detail">
              <div className="month-detail__header">
                <div className="month-detail__title">
                  {MONTHS[selectedMonth]} {selectedYear}
                </div>
                <div className="month-detail__controls">
                  <button
                    className="month-nav"
                    onClick={() => {
                      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1) }
                      else setSelectedMonth((m) => m - 1)
                    }}
                  >‹</button>
                  <button
                    className="month-nav"
                    onClick={() => {
                      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1) }
                      else setSelectedMonth((m) => m + 1)
                    }}
                  >›</button>
                </div>
              </div>

              {monthlyCount.length === 0 ? (
                <div className="month-detail__empty">No registrations this month.</div>
              ) : (
                <>
                  <div className="month-detail__count">
                    <span className="month-detail__num">{monthlyCount.length}</span>
                    <span className="month-detail__sub">
                      employee{monthlyCount.length !== 1 ? 's' : ''} registered
                    </span>
                  </div>
                  <div className="month-detail__list">
                    {monthlyCount.map((emp) => {
                      const c = getColor(emp.id)
                      return (
                        <div className="month-emp-row" key={emp.id}>
                          <div className="u-avatar u-avatar--sm" style={{ background: c.bg, color: c.color }}>
                            {getInitials(emp.name)}
                          </div>
                          <div className="u-info">
                            <div className="u-name">{emp.name}</div>
                            <div className="u-dept">{emp.department || '—'}</div>
                          </div>
                          <div className="u-date">
                            {new Date(emp.created_at).toLocaleDateString('en-PH', {
                              month: 'short', day: 'numeric',
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Mini Stats ── */}
        <div className="bottom-grid">
          <div className="mini-stat">
            <div className="mini-label">Current period</div>
            <div className="mini-value mini-value--blue">
              {currentMonth < 6 ? 'Q1' : 'Q2'} {currentYear}
            </div>
            <div className="mini-sub">
              {currentMonth < 6 ? 'Ends June 30' : 'Ends December 31'}
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-label">Inactive employees</div>
            <div className="mini-value">{inactiveCount}</div>
            <div className="mini-sub">Deactivated accounts</div>
          </div>
          <div className="mini-stat">
            <div className="mini-label">Registered this year</div>
            <div className="mini-value" style={{ color: '#185FA5' }}>{registeredThisYear}</div>
            <div className="mini-sub">{currentYear} total</div>
          </div>
        </div>

      </main>
    </div>
  )
}