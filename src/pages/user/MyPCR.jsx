import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import './MyPCR.css'

const API = import.meta.env.VITE_API_URL

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
})

const fetchMyPCRs = () =>
  axios.get(`${API}/pcr`, getHeaders()).then(r => r.data)

const avgScore = (record) => {
  if (!record) return null
  const all = [
    ...(record.core      || []),
    ...(record.strategic || []),
    ...(record.support   || []),
  ]
  const rated = all.filter((c) => c.score !== undefined && c.score !== null)
  if (!rated.length) return null
  return (rated.reduce((s, c) => s + c.score, 0) / rated.length).toFixed(2)
}

const scoreLabel = (s) => {
  if (s >= 4.5) return 'Outstanding'
  if (s >= 3.5) return 'Very Satisfactory'
  if (s >= 2.5) return 'Satisfactory'
  if (s >= 1.5) return 'Unsatisfactory'
  return 'Poor'
}

const FUNC_COLORS = {
  'Core Function':      { bg: '#E6F1FB', color: '#0C447C', border: '#C2D9F0' },
  'Strategic Function': { bg: '#E1F5EE', color: '#085041', border: '#9FE1CB' },
  'Support Function':   { bg: '#FAEEDA', color: '#633806', border: '#F5CFA0' },
}

const getFunctionGroups = (record) => [
  { label: 'Core Function',      pillars: record.core      || [] },
  { label: 'Strategic Function', pillars: record.strategic || [] },
  { label: 'Support Function',   pillars: record.support   || [] },
]

// ── Shared download helper ──
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function MyPCR({ pcrList, loading, initialSelectedPCR, onClearSelected }) {

  const queryClient = useQueryClient()

  const [selectedPCR, setSelectedPCR] = useState(initialSelectedPCR || null)
  const [search,       setSearch]       = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [currentPage,  setCurrentPage]  = useState(1)


  useEffect(() => {
      document.title = 'My PCR | ePCR'
      return () => { document.title = 'ePCR' }
    }, [])


  const { data: fetchedPCRs = [], isLoading } = useQuery({
    queryKey:             ['pcrs'],
    queryFn:              fetchMyPCRs,
    enabled:              !pcrList,
    staleTime:            0,
    refetchOnWindowFocus: true,
    refetchOnMount:       'always',
  })

  const pcrs          = pcrList || fetchedPCRs
  const isLoadingData = pcrList ? loading : isLoading
  const allPeriods = [...new Set(pcrs.map((r) => r.period))].sort((a, b) => {
    const [qa, ya] = a.split(' ')
    const [qb, yb] = b.split(' ')
    if (ya !== yb) return Number(ya) - Number(yb)
    return qa.localeCompare(qb)
  })

  const filteredPCR = pcrs.filter((r) => {
    const q             = search.toLowerCase()
    const matchesSearch = (
      r.period.toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q)
    )
    const matchesPeriod = periodFilter === 'all' || r.period === periodFilter
    const createdAt     = r.created_at ? new Date(r.created_at) : null
    const fromDate      = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const toDate        = dateTo   ? new Date(dateTo   + 'T23:59:59') : null
    const matchesFrom   = !fromDate || (createdAt && createdAt >= fromDate)
    const matchesTo     = !toDate   || (createdAt && createdAt <= toDate)
    return matchesSearch && matchesPeriod && matchesFrom && matchesTo
  })

  const totalPages    = Math.ceil(filteredPCR.length / 15)
  const paginatedPCRs = filteredPCR.slice(
    (currentPage - 1) * 15,
    currentPage * 15
  )

  const resetPage = (fn) => { fn(); setCurrentPage(1) }

  // ── Delete handler ──
  const handleDelete = async () => {
    try {
      setDeleting(true)
      await axios.delete(`${API}/pcr/${deleteTarget.id}`, getHeaders())
      queryClient.invalidateQueries({ queryKey: ['pcrs'] })
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete PCR:', err.message)
      alert(err.response?.data?.message || 'Failed to delete PCR. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Download PDF ──
  const handleDownloadPDF = async () => {
    try {
      const token   = localStorage.getItem('token')
      const payload = {
        employee: {
          name:          selectedPCR.name,
          position:      selectedPCR.position,
          division:      selectedPCR.division,
          date:          new Date(selectedPCR.created_at).toLocaleDateString('en-US', {
                           year: 'numeric', month: 'long', day: '2-digit',
                         }),
          director:      'Atty. ERNA T. ELIZAN',
          directorTitle: 'Director IV',
        },
        period:    selectedPCR.period,
        core:      (selectedPCR.core      || []).map(p => ({ mfo: p.name, si: p.indicator })),
        strategic: (selectedPCR.strategic || []).map(p => ({ mfo: p.name, si: p.indicator })),
        support:   (selectedPCR.support   || []).map(p => ({ mfo: p.name, si: p.indicator })),
      }

      const res = await fetch(`${API}/pcr/generate-pdf`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) { alert('Failed to generate PDF. Please try again.'); return }

      const blob = await res.blob()
      triggerDownload(
        blob,
        `IPCR_${selectedPCR.name.split(',')[0]}_${selectedPCR.period.replace(/\s/g, '_')}.pdf`
      )
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  // ── Download Excel ──
  const handleDownloadExcel = async () => {
    try {
      const token   = localStorage.getItem('token')
      const payload = {
        employee: {
          name:          selectedPCR.name,
          position:      selectedPCR.position,
          division:      selectedPCR.division,
          date:          new Date(selectedPCR.created_at).toLocaleDateString('en-US', {
                           year: 'numeric', month: 'long', day: 'numeric',
                         }),
          director:      'Atty. ERNA T. ELIZAN',
          directorTitle: 'Director IV',
        },
        period:    selectedPCR.period,
        core:      (selectedPCR.core      || []).map(p => ({ mfo: p.name, si: p.indicator })),
        strategic: (selectedPCR.strategic || []).map(p => ({ mfo: p.name, si: p.indicator })),
        support:   (selectedPCR.support   || []).map(p => ({ mfo: p.name, si: p.indicator })),
      }

      const res = await fetch(`${API}/pcr/generate-excel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) { alert('Failed to generate Excel. Please try again.'); return }

      const blob = await res.blob()
      triggerDownload(
        blob,
        `IPCR_${selectedPCR.name.split(',')[0]}_${selectedPCR.period.replace(/\s/g, '_')}.xlsx`
      )
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  // ── Detail view ──
  if (selectedPCR) {
    const groups = getFunctionGroups(selectedPCR)
    const avg    = avgScore(selectedPCR)

    return (
      <>
        <div className="main-header">
          <div>
            <button className="btn-back" onClick={() => {
              setSelectedPCR(null)
              if (onClearSelected) onClearSelected()
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10 3L5 8l5 5"/>
              </svg>
              Back to My PCR
            </button>
            <h1 className="main-title" style={{ marginTop: 8 }}>{selectedPCR.period} — PCR</h1>
          </div>
          <span className="badge" style={{
            background: '#E6F1FB', color: '#0C447C', fontSize: 13, padding: '5px 14px',
          }}>
            {selectedPCR.period}
          </span>
        </div>

        {/* ── Employee Info Card ── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <div className="card-title">Employee Information</div>
          </div>
          <div className="profile-fields">
            <div className="profile-field">
              <div className="profile-field__label">Name</div>
              <div className="profile-field__value">{selectedPCR.name || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field__label">Position</div>
              <div className="profile-field__value">{selectedPCR.position || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field__label">Division</div>
              <div className="profile-field__value">{selectedPCR.division || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field__label">Covering Period</div>
              <div className="profile-field__value">{selectedPCR.period}</div>
            </div>
            <div className="profile-field">
              <div className="profile-field__label">Date Created</div>
              <div className="profile-field__value">
                {selectedPCR.created_at
                  ? new Date(selectedPCR.created_at).toLocaleDateString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })
                  : '—'
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Function Tables ── */}
        {groups.map(({ label, pillars }) => {
          if (!pillars.length) return null
          const c = FUNC_COLORS[label]
          return (
            <div key={label} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                    padding: '2px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 600,
                  }}>
                    {label}
                  </span>
                  Performance Commitments
                </div>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Major Final Output</th>
                    <th style={{ width: '40%' }}>Success Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {pillars.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.name}</strong></td>
                      <td className="t-muted">{p.indicator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* ── Average Score ── */}
        {avg && (
          <div className="avg-score-row">
            <span>Average Score:</span>
            <strong className={`score-chip score-chip--${avg >= 4 ? 'high' : avg >= 3 ? 'mid' : 'low'}`}>
              {avg} — {scoreLabel(parseFloat(avg))}
            </strong>
          </div>
        )}

        {/* ── Admin Feedback ── */}
        {selectedPCR.comments && (
          <div className="card">
            <div className="card-header"><div className="card-title">Admin Feedback</div></div>
            <div className="feedback-box">{selectedPCR.comments}</div>
          </div>
        )}

        {/* ── Download Buttons ── */}
        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn-generate" onClick={handleDownloadPDF}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Download PDF
          </button>
          <button className="btn-generate" onClick={handleDownloadExcel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
            Download Excel
          </button>
        </div>
      </>
    )
  }

 // ── List view ──
  return (
    <>
      <div className="main-header">
        <div>
          <h1 className="main-title">My PCR</h1>
          <p className="page-sub">A record of all your submitted performance commitment reviews</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <input
          className="search-box"
          placeholder="Search by period or name..."
          value={search}
          onChange={(e) => resetPage(() => setSearch(e.target.value))}
        />
        <select
          className="filter-select"
          value={periodFilter}
          onChange={(e) => resetPage(() => setPeriodFilter(e.target.value))}
        >
          <option value="all">All Periods</option>
          {allPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="date-range-wrap">
          <span className="date-range-label">From</span>
          <input
            type="date"
            className="date-input"
            value={dateFrom}
            onChange={(e) => resetPage(() => setDateFrom(e.target.value))}
          />
          <span className="date-range-label">To</span>
          <input
            type="date"
            className="date-input"
            value={dateTo}
            onChange={(e) => resetPage(() => setDateTo(e.target.value))}
          />
          {(dateFrom || dateTo) && (
            <button
              className="date-clear-btn"
              onClick={() => resetPage(() => { setDateFrom(''); setDateTo('') })}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {isLoadingData ? (
          <div className="table-card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '4%'  }}>#</th>
                  <th style={{ width: '10%' }}>Period</th>
                  <th style={{ width: '22%' }}>Name</th>
                  <th style={{ width: '13%' }}>Date Created</th>
                  <th style={{ width: '13%' }}>Core Pillars</th>
                  <th style={{ width: '13%' }}>Strategic Pillars</th>
                  <th style={{ width: '13%' }}>Support Pillars</th>
                  <th style={{ width: '13%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ height: 52 }}>
                    <td><div className="skeleton skeleton-text--xs" style={{ width: 20, margin: '0 auto' }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: 60 }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: '80%' }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: 90 }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: 70 }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: 70 }} /></td>
                    <td><div className="skeleton skeleton-text--sm" style={{ width: 70 }} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="skeleton skeleton-text--sm" style={{ width: 36, height: 24 }} />
                        <div className="skeleton skeleton-text--sm" style={{ width: 50, height: 24 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredPCR.length === 0 ? (
          <div className="table-empty">No PCR records found.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '4%',  fontWeight: 600, textAlign: 'center' }}>#</th>
                <th style={{ width: '10%', fontWeight: 600 }}>Period</th>
                <th style={{ width: '22%', fontWeight: 600, textAlign: 'center' }}>Name</th>
                <th style={{ width: '13%', fontWeight: 600 }}>Date Created</th>
                <th style={{ width: '13%', color: '#0C447C', fontWeight: 600 }}>Core Pillars</th>
                <th style={{ width: '13%', color: '#085041', fontWeight: 600 }}>Strategic Pillars</th>
                <th style={{ width: '13%', color: '#633806', fontWeight: 600 }}>Support Pillars</th>
                <th style={{ width: '13%', fontWeight: 600, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPCRs.map((r, index) => (
                <tr key={r.id}>
                  <td className="t-muted" style={{ textAlign: 'center' }}>
                    {(currentPage - 1) * 15 + index + 1}
                  </td>
                  <td className="t-name">{r.period}</td>
                  <td className="t-muted">{r.name || '—'}</td>
                  <td className="t-muted">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : '—'
                    }
                  </td>
                  <td className="t-muted">
                    {(r.core      || []).length} pillar{(r.core      || []).length !== 1 ? 's' : ''}
                  </td>
                  <td className="t-muted">
                    {(r.strategic || []).length} pillar{(r.strategic || []).length !== 1 ? 's' : ''}
                  </td>
                  <td className="t-muted">
                    {(r.support   || []).length} pillar{(r.support   || []).length !== 1 ? 's' : ''}
                  </td>
                  <td>
                    <div className="t-actions">
                      <button className="btn-sm"            onClick={() => setSelectedPCR(r)}>View</button>
                      <button className="btn-sm btn-danger" onClick={() => setDeleteTarget(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: 15 - paginatedPCRs.length }).map((_, i) => (
                <tr key={`filler-${i}`} style={{ height: 52 }}>
                  <td colSpan={8}></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
        <span className="pagination-info">
          Showing {filteredPCR.length === 0 ? 0 : (currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, filteredPCR.length)} of {filteredPCR.length} records
        </span>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button className="page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...'
                  ? <span key={`e-${idx}`} className="page-ellipsis">…</span>
                  : <button
                      key={p}
                      className={`page-btn ${currentPage === p ? 'page-btn--active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >{p}</button>
              )
            }
            <button className="page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
          </div>
        )}

        <div style={{ visibility: 'hidden' }}>
          <span className="pagination-info">
            Showing {filteredPCR.length === 0 ? 0 : (currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, filteredPCR.length)} of {filteredPCR.length} records
          </span>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete PCR</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>
            <p className="delete-msg">
              Are you sure you want to delete the PCR for{' '}
              <strong>{deleteTarget.period}</strong>
              {deleteTarget.name ? <> — <strong>{deleteTarget.name}</strong></> : ''}?
              <br />This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#c0392b', color: '#fff', borderColor: '#c0392b' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}