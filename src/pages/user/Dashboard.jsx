import UserLayout from '../../components/layout/UserLayout'
import { getCoveringPeriod } from '../../utils/dateUtils'
import MyPCR from './MyPCR'
import CreatePCR from './CreatePCR'
import UserProfile from './UserProfile'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import './Dashboard.css'

const API = import.meta.env.VITE_API_URL

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
})

const fetchMyPCRs = () =>
  axios.get(`${API}/pcr`, getAuthHeaders()).then(r => r.data)

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']


const typeColors = {
  Commitment: { bg: '#E6F1FB', color: '#0C447C' },
  Rating:     { bg: '#EEEDFE', color: '#3C3489' },
}

export default function UserDashboard() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('activeTab') || 'dashboard')
  const [selectedPCR, setSelectedPCR] = useState(null) 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear())

  const user        = JSON.parse(localStorage.getItem('user'))
  const currentYear = new Date().getFullYear()

  useEffect(() => {
      document.title = 'Dashboard | ePCR'
      return () => { document.title = 'ePCR' }
    }, [])

    // Add this useEffect
    useEffect(() => {
      sessionStorage.setItem('activeTab', tab)
    }, [tab])

  // ── Fetch real PCR data ──
  const { data: pcrs = [], isLoading } = useQuery({
    queryKey:             ['pcrs'],
    queryFn:              fetchMyPCRs,
    staleTime:            0,
    refetchOnWindowFocus: true,
    refetchOnMount:       'always',
  })

  // ── Derived stats ──
  const totalPCR    = pcrs.length
  const YEARS       = [...new Set(pcrs.map(r => new Date(r.created_at).getFullYear()))].sort((a, b) => b - a)

  // ── Top 3 recent ──
  const recentPCR = [...pcrs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  // ── Monthly PCR for selected month/year ──
  const monthlyPCR = pcrs.filter((r) => {
    const d = new Date(r.created_at)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  // ── Bar chart: all 12 months for selected year ──
  const monthlyData = MONTHS.map((month, i) => ({
    month: month.slice(0, 3),
    count: pcrs.filter((r) => {
      const d = new Date(r.created_at)
      return d.getMonth() === i && d.getFullYear() === selectedYear
    }).length,
  }))
  const maxCount = Math.max(...monthlyData.map((m) => m.count), 1)

  // ── Yearly summary ──
  const yearlyData = YEARS.map((year) => ({
    year,
    total: pcrs.filter(r => new Date(r.created_at).getFullYear() === year).length,
  }))

  const renderTab = () => {
    if (tab === 'pcr') return (
      <MyPCR
        pcrList={pcrs}
        loading={isLoading}
        initialSelectedPCR={selectedPCR}
        onClearSelected={() => setSelectedPCR(null)}
      />
    )
    if (tab === 'create')  return <CreatePCR />
    if (tab === 'profile') return <UserProfile />

    if (isLoading) {
        return (
          <UserLayout tab={tab} setTab={setTab}>
            {/* Header */}
            <div className="main-header">
              <div>
                <div className="skeleton skeleton-text--lg" style={{ width: 200 }} />
                <div className="skeleton skeleton-text--sm" style={{ width: 160, marginTop: 6 }} />
              </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton-text--sm" />
                  <div className="skeleton skeleton-text--lg" />
                  <div className="skeleton skeleton-text--xs" />
                </div>
              ))}
            </div>

            {/* Mid Grid */}
            <div className="mid-grid">
              {/* Recent PCR skeleton */}
              <div className="skeleton-card">
                <div className="skeleton skeleton-text--sm" style={{ width: 120, marginBottom: 16 }} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="skeleton-row" key={i}>
                    <div className="skeleton skeleton-avatar" />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text--full" />
                      <div className="skeleton skeleton-text--half" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Chart skeleton */}
              <div className="skeleton-card">
                <div className="skeleton skeleton-text--sm" style={{ width: 120, marginBottom: 16 }} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 16 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton"
                      style={{ flex: 1, height: `${Math.random() * 60 + 20}%`, borderRadius: '4px 4px 0 0' }}
                    />
                  ))}
                </div>
                <div className="skeleton skeleton-text--sm" style={{ width: 100, marginBottom: 12 }} />
                <div className="skeleton skeleton-text--full" />
                <div className="skeleton skeleton-text--half" />
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="stats-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton-text--sm" />
                  <div className="skeleton skeleton-text--lg" />
                  <div className="skeleton skeleton-text--xs" />
                </div>
              ))}
            </div>
          </UserLayout>
        )
      }

        const getPCRInitials = (name) =>
      name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'PC'

    const avatarColors = [
      { bg: '#E6F1FB', color: '#0C447C' },
      { bg: '#E1F5EE', color: '#085041' },
      { bg: '#FAEEDA', color: '#633806' },
      { bg: '#EEEDFE', color: '#3C3489' },
      { bg: '#FAECE7', color: '#712B13' },
    ]
    const getPCRColor = (id) => avatarColors[id % avatarColors.length]

    return (
      <>
        {/* ── Header ── */}
        <div className="main-header">
          <div>
            <h1 className="main-title">
              Welcome, {user?.name?.split(',')[0] || 'Employee'} 👋
            </h1>
            <p className="page-sub">Here's your PCR analytics overview</p>
          </div>
          <div className="main-date">{currentYear} · Overview</div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          {[
            { label: 'Total PCR',       value: totalPCR,                                        sub: 'Across all PCRs',  color: null      },
            { label: 'Core Pillars',    value: pcrs.reduce((s, r) => s + (r.core      || []).length, 0), sub: 'Across all PCRs', color: '#0C447C' },
            { label: 'Support Pillars', value: pcrs.reduce((s, r) => s + (r.support   || []).length, 0), sub: 'Across all PCRs', color: '#633806' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Mid Grid: Recent PCR + Monthly Chart ── */}
        <div className="mid-grid">

          {/* Recent PCR */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                Recent PCR <span className="card-title-sub">Top 10</span>
              </div>
              <button className="card-action" onClick={() => setTab('pcr')}>See all </button>
            </div>

            {recentPCR.map((r, index) => (   // 👈 add index
              <div className="user-row" key={r.id}>

                {/* 👇 wrap icon and number together */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#aaa', minWidth: 16, textAlign: 'right' }}>
                    {index + 1}
                  </span>
                  <div
                    className="u-avatar"
                    style={{
                      background: getPCRColor(r.id).bg,
                      color: getPCRColor(r.id).color,
                    }}
                  >
                    {getPCRInitials(r.name)}
                  </div>
                </div>

                <div className="u-info">
                  <div
                    className="u-name u-name--link"
                    onClick={() => { setSelectedPCR(r); setTab('pcr') }}
                  >
                    {r.name || 'PCR'}
                  </div>    
                  <div className="u-dept">
                   {new Date(r.created_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="pcr-row-badges">
                  <span className="u-badge" style={{ background: '#E6F1FB', color: '#0C447C' }}>
                    {r.period}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Monthly PCR</div>
              <select
                className="filter-select filter-select--sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(+e.target.value)}
              >
                {YEARS.length === 0
                  ? <option value={currentYear}>{currentYear}</option>
                  : YEARS.map((y) => <option key={y} value={y}>{y}</option>)
                }
              </select>
            </div>

            {/* Bar chart */}
            <div className="bar-chart">
              {monthlyData.map((m, i) => (
                <div
                  key={m.month}
                  className={`bar-chart__col ${i === selectedMonth ? 'bar-chart__col--active' : ''}`}
                  onClick={() => setSelectedMonth(i)}
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
                      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
                      else setSelectedMonth(m => m - 1)
                    }}
                  >‹</button>
                  <button
                    className="month-nav"
                    onClick={() => {
                      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
                      else setSelectedMonth(m => m + 1)
                    }}
                  >›</button>
                </div>
              </div>

              {monthlyPCR.length === 0 ? (
                <div className="month-detail__empty">No PCR submitted this month.</div>
              ) : (
                <>
                  <div className="month-detail__count">
                    <span className="month-detail__num">{monthlyPCR.length}</span>
                    <span className="month-detail__sub">
                      PCR{monthlyPCR.length !== 1 ? 's' : ''} made this month
                    </span>
                  </div>
                  <div className="month-detail__list">
                    {monthlyPCR.map((r) => (
                      <div className="month-emp-row" key={r.id}>
                        <div
                          className="pcr-type-icon pcr-type-icon--sm"
                          style={{ background: '#E6F1FB', color: '#0C447C' }}
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <path d="M4 6h8M4 9h6M4 12h4"/>
                            <rect x="1" y="2" width="14" height="13" rx="1.5"/>
                          </svg>
                        </div>
                        <div className="u-info">
                          <div className="u-name">{r.name || 'PCR'}</div>
                          <div className="u-dept">
                            {r.period} · {new Date(r.created_at).toLocaleDateString('en-PH', {
                              month: 'short', day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Yearly Summary ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Yearly Summary</div>
            <span className="card-title-sub">
              {YEARS.length} year{YEARS.length !== 1 ? 's' : ''} of records
            </span>
          </div>

          {yearlyData.length === 0 ? (
            <div className="table-empty">No records found.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Year</th>
                  <th style={{ width: '20%' }}>Total PCR</th>
                  <th style={{ width: '25%' }}>Core Pillars</th>
                  <th style={{ width: '25%' }}>Support Pillars</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.map((y) => (
                  <tr key={y.year}>
                    <td>
                      <span className={`year-chip ${y.year === currentYear ? 'year-chip--current' : ''}`}>
                        {y.year}
                      </span>
                    </td>
                    <td className="t-name">{y.total}</td>
                    <td>
                      <span className="badge" style={{ background: '#E6F1FB', color: '#0C447C' }}>
                        {pcrs
                          .filter(r => new Date(r.created_at).getFullYear() === y.year)
                          .reduce((s, r) => s + (r.core || []).length, 0)
                        } pillars
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#FAEEDA', color: '#633806' }}>
                        {pcrs
                          .filter(r => new Date(r.created_at).getFullYear() === y.year)
                          .reduce((s, r) => s + (r.support || []).length, 0)
                        } pillars
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Info Card ── */}
        <div className="info-card">
          <div className="info-card__icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="8" cy="8" r="7"/><path d="M8 7v5M8 5v.5"/>
            </svg>
          </div>
          <div>
            <div className="info-card__title">Current Period: {getCoveringPeriod()}</div>
            <div className="info-card__sub">
              Please be reminded that the 1st Semester Evaluation Period ends on <strong>June 30, 2026.</strong> <br/>
              Ensure all core and support commitments are fully rated and submitted to HR on or before the prescribed deadline.

              Note: The 2nd Semester Rating Period will conclude on <strong>December 31, 2026.</strong>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <UserLayout tab={tab} setTab={setTab}>
      {renderTab()}
    </UserLayout>
  )
}