import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Sidebar from '../../components/layout/Sidebar'
import './Reports.css'

const API = import.meta.env.VITE_API_URL
const ONLINE_THRESHOLD_MINUTES = 10

const avatarColors = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#dcfce7', color: '#166534' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fee2e2', color: '#991b1b' },
]

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

const getColor = (id) => avatarColors[id % avatarColors.length]

const isOnline = (last_seen) => {
  if (!last_seen) return false
  const diffMins = (new Date() - new Date(last_seen)) / 1000 / 60
  return diffMins <= ONLINE_THRESHOLD_MINUTES
}

const formatLastSeen = (last_seen, online) => {
  if (!last_seen) return null
  const date = new Date(last_seen)
  if (online) {
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }
  return (
    date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function Reports() {
  const token = localStorage.getItem('token')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-presence'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    },
    refetchInterval:      15000,
    refetchOnWindowFocus: true,
    staleTime:            0,
  })

  const onlineUsers  = users.filter((u) => isOnline(u.last_seen))
  const offlineUsers = users.filter((u) => !isOnline(u.last_seen))

  useEffect(() => {
      document.title = 'Reports | ePCR'
      return () => { document.title = 'ePCR' }
    }, [])

  const UserRow = ({ u, idx, online }) => {
    const c = getColor(u.id)
    const lastSeen = formatLastSeen(u.last_seen, online)
    return (
      <tr key={u.id}>
        <td className="t-muted" style={{ textAlign: 'center' }}>{idx + 1}</td>
        <td>
          <div className="t-name-cell">
            <div className="avatar-wrap">
              <div
                className="t-avatar"
                style={{
                  background: c.bg,
                  color: c.color,
                  opacity: online ? 1 : 0.6,
                }}
              >
                {getInitials(u.name)}
              </div>
              {online && <span className="avatar-online-dot" />}
            </div>
            <div>
              <div className="t-name" style={{ color: online ? '#111' : '#94a3b8' }}>
                {u.name}
              </div>
              <div className="t-email">{u.email}</div>
            </div>
          </div>
        </td>
        <td className="t-muted">{u.department || '—'}</td>
        <td className="t-muted">{u.position || '—'}</td>
        <td>
          <span className={`badge badge-${u.role}`}>
            {u.role === 'admin' ? 'Admin' : 'Employee'}
          </span>
        </td>
        <td>
          {lastSeen ? (
            <span className={`last-seen-chip ${online ? 'last-seen-chip--online' : ''}`}>
              {online && '●  '}{lastSeen}
            </span>
          ) : (
            <span className="never-badge">Never logged in</span>
          )}
        </td>
      </tr>
    )
  }

  const TableHead = () => (
    <thead>
      <tr>
        <th style={{ width: '4%'  }}>#</th>
        <th style={{ width: '28%' }}>Employee</th>
        <th style={{ width: '20%' }}>Division</th>
        <th style={{ width: '18%' }}>Position</th>
        <th style={{ width: '10%' }}>Role</th>
        <th style={{ width: '20%' }}>Last Seen</th>
      </tr>
    </thead>
  )

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Online Users</h1>
            <p className="page-sub">Real-time presence of active system users</p>
          </div>
          <div className="online-badge">
            <span className="online-badge__dot" />
            {onlineUsers.length} online now
          </div>
        </div>

        {/* ── Online Users ── */}
        <div className="presence-card">
          <div className="presence-card__header">
            <span className="presence-card__dot presence-card__dot--online" />
            <span className="presence-card__title">Online — {onlineUsers.length}</span>
          </div>

          {isLoading ? (
          <table className="tbl">
            <TableHead />
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ height: 52 }}>
                  <td><div className="skeleton skeleton-text--xs" style={{ width: 20, margin: '0 auto' }} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="skeleton skeleton-avatar" />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text--full" style={{ marginBottom: 4 }} />
                        <div className="skeleton skeleton-text--half" />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton skeleton-text--sm" style={{ width: '70%' }} /></td>
                  <td><div className="skeleton skeleton-text--sm" style={{ width: '60%' }} /></td>
                  <td><div className="skeleton skeleton-text--sm" style={{ width: 50 }} /></td>
                  <td><div className="skeleton skeleton-text--sm" style={{ width: 80 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : onlineUsers.length === 0 ? (
            <div className="table-empty" style={{ padding: '24px', color: '#94a3b8', textAlign: 'center' }}>
              No users currently online.
            </div>
          ) : (
            <table className="tbl">
              <TableHead />
              <tbody>
                {onlineUsers.map((u, idx) => (
                  <UserRow key={u.id} u={u} idx={idx} online={true} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Offline Users ── */}
        <div className="presence-card">
          <div className="presence-card__header">
            <span className="presence-card__dot presence-card__dot--offline" />
            <span className="presence-card__title">Offline — {offlineUsers.length}</span>
          </div>

          {offlineUsers.length === 0 ? (
            <div className="table-empty" style={{ padding: '24px', color: '#94a3b8', textAlign: 'center' }}>
              🎉 Everyone is online!
            </div>
          ) : (
            <table className="tbl">
              <TableHead />
              <tbody>
                {offlineUsers.map((u, idx) => (
                  <UserRow key={u.id} u={u} idx={idx} online={false} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer">
          {users.length} total users · refreshes every 15 seconds
        </div>

      </main>
    </div>
  )
}