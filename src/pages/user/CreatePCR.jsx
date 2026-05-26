import { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import './CreatePCR.css'
import { DIVISIONS, POSITIONS, NAMES} from '../../utils/constants'

const API = import.meta.env.VITE_API_URL

const OBJ_COLORS = {
  'Core Function':      { bg: '#E6F1FB', color: '#0C447C', border: '#C2D9F0' },
  'Strategic Function': { bg: '#E1F5EE', color: '#085041', border: '#9FE1CB' },
  'Support Function':   { bg: '#FAEEDA', color: '#633806', border: '#F5CFA0' },
}

const OBJECTIVES    = ['Core Function', 'Strategic Function', 'Support Function']
const EMPTY_PILLARS = { 'Core Function': [], 'Strategic Function': [], 'Support Function': [] }

const MAIN_STEPS = [
  { label: 'Employee Details'               },
  { label: 'Select Objective & Commitments' },
  { label: 'Review Generated PCR'           },
]

const generatePeriodOptions = () => {
  const currentYear = new Date().getFullYear()
  const years       = [currentYear, currentYear + 1]
  const options     = []
  years.forEach((year) => {
    options.push({ label: `Q1 ${year} (January – June ${year})`,  value: `Q1 ${year}` })
    options.push({ label: `Q2 ${year} (July – December ${year})`, value: `Q2 ${year}` })
  })
  return options
}

const getDefaultPeriod = () => {
  const now     = new Date()
  const year    = now.getFullYear()
  const quarter = now.getMonth() < 6 ? 'Q1' : 'Q2'
  return `${quarter} ${year}`
}

const PERIOD_OPTIONS = generatePeriodOptions()

export default function CreatePCR({ onViewPCR }) {
  // ── TanStack Query client for cache invalidation ──
  const queryClient = useQueryClient()

  const [step,              setStep]              = useState(1)
  const [form,              setForm]              = useState({
    name:       '',
    position:   '',
    department: '',
    period:     getDefaultPeriod(),
  })
  const [errors,            setErrors]            = useState({})
  const [success,           setSuccess]           = useState(false)
  const [submitting,        setSubmitting]        = useState(false)
  const [selectedObj,       setSelectedObj]       = useState('')
  const [pillarCommitments, setPillarCommitments] = useState(EMPTY_PILLARS)
  const [pillarPage, setPillarPage] = useState(1)
  const [selectMode, setSelectMode] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdPCRId, setCreatedPCRId] = useState(null)
  const [createdPCR, setCreatedPCR] = useState(null)
  const [pillarSearch, setPillarSearch] = useState('')

      useEffect(() => {
          document.title = 'Create | ePCR'
          return () => { document.title = 'ePCR' }
        }, [])

      const { data: pillarsData = EMPTY_PILLARS, isLoading: pillarsLoading } = useQuery({
      queryKey: ['pillars', form.department],
      queryFn:  async () => {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(`${API}/pillars`, {
          headers: { Authorization: `Bearer ${token}` },
          params:  { division: form.department },
        })
        const grouped = {
          'Core Function':      [],
          'Strategic Function': [],
          'Support Function':   [],
        }
        data.forEach((p) => {
          if (grouped[p.type]) {
            grouped[p.type].push({
              id:        p.id,
              name:      p.name,
              indicator: p.description,
              target:    '100%',
              weight:    p.weight,
            })
          }
        })
        return grouped
      },
      enabled:   !!form.department,
      staleTime: 1000 * 60 * 5,
    })

  const allObjectivesFilled = Object.values(pillarCommitments).some((a) => a.length > 0)
  const hasCommits          = Object.values(pillarCommitments).some((a) => a.length > 0)

  const togglePillar = (obj, pillar) => {
    setPillarCommitments((prev) => {
      const exists = prev[obj].some((p) => p.id === pillar.id)
      return { ...prev, [obj]: exists ? prev[obj].filter((p) => p.id !== pillar.id) : [...prev[obj], { ...pillar }] }
    })
  }

  const reset = () => {
    setStep(1)
    setForm({ name: '', position: '', department: '', period: getDefaultPeriod() })
    setErrors({})
    setSuccess(false)
    setSubmitting(false)
    setSelectedObj('')
    setPillarCommitments(EMPTY_PILLARS)
    setCreatedPCRId(null)
    setCreatedPCR(null)
  }

  // ── Generate & save PCR ──
    const handleGenerate = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')

      const { data: newPCR } = await axios.post(`${API}/pcr`, {
        period:    form.period,
        name:      form.name,
        position:  form.position,
        division:  form.department,
        core:      pillarCommitments['Core Function'].map(p => ({
          id: p.id, name: p.name, indicator: p.indicator, target: p.target, weight: p.weight,
        })),
        strategic: pillarCommitments['Strategic Function'].map(p => ({
          id: p.id, name: p.name, indicator: p.indicator, target: p.target, weight: p.weight,
        })),
        support:   pillarCommitments['Support Function'].map(p => ({
          id: p.id, name: p.name, indicator: p.indicator, target: p.target, weight: p.weight,
        })),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      queryClient.invalidateQueries({ queryKey: ['pcrs'] })
      setCreatedPCR({
      id:         newPCR.id,
      name:       form.name,
      position:   form.position,
      division:   form.department,
      period:     form.period,
      created_at: new Date().toISOString(),
      core:       pillarCommitments['Core Function'],
      strategic:  pillarCommitments['Strategic Function'],
      support:    pillarCommitments['Support Function'],
    })
      setSuccess(true)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Failed to save PCR:', err.message)
      alert(err.response?.data?.message || 'Failed to save PCR. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name)       errs.name       = 'Please select a name'
    if (!form.position)   errs.position   = 'Please select a position'
    if (!form.department) errs.department = 'Please select a division'
    if (!form.period)     errs.period     = 'Please select a covering period'
    if (Object.keys(errs).length) return setErrors(errs)
    setStep(2)
  }

  const missingObjectives = OBJECTIVES.filter((obj) => pillarCommitments[obj].length === 0)

  // ── Download PDF ──
  const handleDownloadPDF = async () => {
    const token = localStorage.getItem('token')
    const payload = {
      employee: {
        name:          form.name,
        position:      form.position,
        division:      form.department,
        date:          new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
        director:      'Atty. ERNA T. ELIZAN',
        directorTitle: 'Director IV',
      },
      period:    form.period,
      core:      pillarCommitments['Core Function'].map(p => ({ mfo: p.name, si: p.indicator })),
      strategic: pillarCommitments['Strategic Function'].map(p => ({ mfo: p.name, si: p.indicator })),
      support:   pillarCommitments['Support Function'].map(p => ({ mfo: p.name, si: p.indicator })),
    }
    const res = await fetch(`${import.meta.env.VITE_API_URL}/pcr/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('PDF generation failed:', await res.text())
      alert('Failed to generate PDF. Please try again.')
      return
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `IPCR_${form.name.split(',')[0]}_${form.period.replace(/\s/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Download Excel ──
  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        employee: {
          name:          form.name,
          position:      form.position,
          division:      form.department,
          date:          new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          director:      'Atty. ERNA T. ELIZAN',
          directorTitle: 'Director IV',
        },
        period:    form.period,
        core:      pillarCommitments['Core Function'].map(p => ({ mfo: p.name, si: p.indicator })),
        strategic: pillarCommitments['Strategic Function'].map(p => ({ mfo: p.name, si: p.indicator })),
        support:   pillarCommitments['Support Function'].map(p => ({ mfo: p.name, si: p.indicator })),
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pcr/generate-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `IPCR_${form.name.split(',')[0]}_${form.period.replace(/\s/g, '_')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <>
      <div className="main-header">
        <div>
          <h1 className="main-title">Create PCR</h1>
          <p className="page-sub">Create a new Individual Performance Commitment Review</p>
        </div>
      </div>

      {/* ── Step progress bar ── */}
      <div className="pcr-main-steps">
        {MAIN_STEPS.map((s, i) => {
          const num      = i + 1
          const isDone   = step > num
          const isActive = step === num
          const isLast   = i === MAIN_STEPS.length - 1
          return (
            <div key={s.label} className="pcr-main-steps__item">
              <div className="pcr-main-steps__track">
                <div className={`pcr-main-steps__dot ${isDone ? 'pcr-main-steps__dot--done' : ''} ${isActive ? 'pcr-main-steps__dot--active' : ''}`}>
                  {isDone ? '✓' : num}
                </div>
                {!isLast && (
                  <div className={`pcr-main-steps__line ${isDone ? 'pcr-main-steps__line--done' : ''}`} />
                )}
              </div>
              <div className={`pcr-main-steps__label ${isDone ? 'pcr-main-steps__label--done' : ''} ${isActive ? 'pcr-main-steps__label--active' : ''}`}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ STEP 1: Employee Details ══ */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Step 1 — Employee Details</div>
            <span className="covering-period-badge">📅 Covering Period: <strong>{form.period}</strong></span>
          </div>
          <form noValidate onSubmit={handleStep1Submit}>
            <div className="form-row">
              <label className="form-label">Covering Period</label>
              <select
                className={`form-select ${errors.period ? 'input-error' : ''}`}
                value={form.period}
                onChange={(e) => { setForm({ ...form, period: e.target.value }); setErrors({ ...errors, period: '' }) }}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.period && <span className="field-error">{errors.period}</span>}
            </div>

            <div className="form-row">
              <label className="form-label">Name</label>
              <select className={`form-select ${errors.name ? 'input-error' : ''}`} value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}>
                <option value="">— Select name —</option>
                {NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Position</label>
                <select className={`form-select ${errors.position ? 'input-error' : ''}`} value={form.position}
                  onChange={(e) => { setForm({ ...form, position: e.target.value }); setErrors({ ...errors, position: '' }) }}>
                  <option value="">— Select position —</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.position && <span className="field-error">{errors.position}</span>}
              </div>
              <div className="form-row">
                <label className="form-label">Division</label>
                <select className={`form-select ${errors.department ? 'input-error' : ''}`} value={form.department}
                  onChange={(e) => {
                      setForm({ ...form, department: e.target.value })
                      setErrors({ ...errors, department: '' })
                      setPillarCommitments(EMPTY_PILLARS)
                      setSelectedObj('')
                    }}>
                  <option value="">— Select division —</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <span className="field-error">{errors.department}</span>}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 8 }}>
              <button type="submit" className="btn-save">
                Next <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ STEP 2: Select Objectives ══ */}
      {step === 2 && (
        <>
          <div className="pcr-summary-strip">
            {[
              { label: 'Name',     value: form.name       },
              { label: 'Position', value: form.position   },
              { label: 'Division', value: form.department },
              { label: 'Period',   value: form.period     },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'contents' }}>
                <div className="pcr-summary-item">
                  <span className="pcr-summary-label">{item.label}</span>
                  <span className="pcr-summary-value">{item.value}</span>
                </div>
                {i < arr.length - 1 && <div className="pcr-summary-divider" />}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Step 2 — Select Objective & Add Commitments</div>
              <div className="obj-completion">
                {OBJECTIVES.map((obj) => {
                  const oc   = OBJ_COLORS[obj]
                  const done = pillarCommitments[obj].length > 0
                  return (
                    <span
                      key={obj}
                      className={`obj-completion__chip ${done ? 'obj-completion__chip--done' : ''}`}
                      style={done ? { background: oc.bg, color: oc.color, border: `1px solid ${oc.border}` } : {}}
                    >
                      {done ? '✓' : '○'} {obj}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="objective-tabs">
              {OBJECTIVES.map((obj) => {
                const oc       = OBJ_COLORS[obj]
                const isActive = selectedObj === obj
                const count    = pillarCommitments[obj].length
                return (
                  <button key={obj}
                    className={`objective-tab ${isActive ? 'objective-tab--active' : ''}`}
                    style={isActive ? { background: oc.bg, borderColor: oc.border, color: oc.color } : {}}
                    onClick={() => { setSelectedObj(obj); setPillarPage(1); setSelectMode(false), setPillarSearch('') }}
                  >
                    <span className="objective-tab__label">{obj}</span>
                    {count > 0 && (
                      <span className="objective-tab__count" style={{ background: oc.bg, color: oc.color, border: `1px solid ${oc.border}` }}>
                        {count} added
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedObj && (() => {
  const ITEMS_PER_PAGE = 10
  const pillars = (pillarsData[selectedObj] || []).filter((p) =>
  p.name.toLowerCase().includes(pillarSearch.toLowerCase()) ||
  p.indicator.toLowerCase().includes(pillarSearch.toLowerCase())
  )
  const totalPages = Math.ceil(pillars.length / ITEMS_PER_PAGE)
  const paginated = pillars.slice((pillarPage - 1) * ITEMS_PER_PAGE, pillarPage * ITEMS_PER_PAGE)
  const oc = OBJ_COLORS[selectedObj]

  const allPageSelected = paginated.length > 0 && paginated.every((p) =>
    pillarCommitments[selectedObj].some((c) => c.id === p.id)
  )

 const handleMassAdd = () => {
  setSelectMode(false)
}

  const handleSelectAll = () => {
    if (allPageSelected) {
      // Deselect all on page
      setPillarCommitments((prev) => ({
        ...prev,
        [selectedObj]: prev[selectedObj].filter(
          (c) => !paginated.some((p) => p.id === c.id)
        ),
      }))
    } else {
      // Select all on page
      setPillarCommitments((prev) => {
        const existing = prev[selectedObj]
        const toAdd = paginated.filter((p) => !existing.some((c) => c.id === p.id))
        return { ...prev, [selectedObj]: [...existing, ...toAdd] }
      })
    }
  }

  const selectedCount = paginated.filter((p) =>
    pillarCommitments[selectedObj].some((c) => c.id === p.id)
  ).length

  return (
   <div className="pillar-section">
    <div className="pillar-section__header">
      <div className="pillar-section__header-left">
        <span className="pillar-section__title" style={{ color: oc.color }}>
          Available — {selectedObj}
        </span>
        <input
          type="text"
          className="search-box"
          placeholder={`Search ${selectedObj} pillars...`}
          value={pillarSearch}
          onChange={(e) => { setPillarSearch(e.target.value); setPillarPage(1) }}
        />
      </div>
      <div className="pillar-section__header-right">
        {selectMode && (
          <span className="pillar-selected-count">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        )}
        {selectMode && selectedCount > 0 && (
          <button
            className="btn-sm"
            style={{ background: oc.bg, color: oc.color, borderColor: oc.border }}
            onClick={handleMassAdd}
          >
            Done
          </button>
        )}
        {pillars.length > 0 && (
          <button
            className={`btn-sm ${selectMode ? 'btn-danger' : ''}`}
            onClick={() => setSelectMode((v) => !v)}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
        {!selectMode && pillars.length > 0 && (
          <span className="field-hint" style={{ margin: 0 }}>Click "+ Add" to include a pillar</span>
        )}
      </div>
    </div>

      {pillarsLoading ? (
        <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>Loading pillars...</div>
      ) : pillars.length === 0 ? (
         <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" width="48" height="48">
            <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
          </svg>
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>
            No pillars available for <strong>{selectedObj}</strong>.
          </p>
        </div>
      ) : (
        <>
          <table className="tbl" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                            {selectMode && (
                              <th style={{ width: '4%', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={allPageSelected}
                                  onChange={handleSelectAll}
                                />
                              </th>
                            )}
                            <th style={{ width: selectMode ? '3%' : '4%', textAlign: 'center' }}>#</th>
                            <th style={{ width: '22%' }}>Pillar Name</th>
                            <th style={{ width: '44%' }}>Description</th>
                            {!selectMode && <th style={{ width: '6%' }}>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((pillar, index) => {
                            const added = pillarCommitments[selectedObj].some((p) => p.id === pillar.id)
                            const rowNum = (pillarPage - 1) * ITEMS_PER_PAGE + index + 1
                            return (
                              <tr
                                key={pillar.id}
                                style={{ background: added ? oc.bg : undefined }}
                                onClick={selectMode ? () => togglePillar(selectedObj, pillar) : undefined}
                                className={selectMode ? 'pillar-tbl__row' : ''}
                              >
                                {selectMode && (
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={added}
                                      onChange={() => togglePillar(selectedObj, pillar)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </td>
                                )}
                                <td className="t-muted" style={{ textAlign: 'center' }}>{rowNum}</td>
                                <td className="t-name">{pillar.name}</td>
                                <td className="t-muted">{pillar.indicator}</td>
                                {!selectMode && (
                                  <td>
                                    <button
                                      className={`btn-sm ${added ? 'btn-danger' : ''}`}
                                      style={!added ? { color: oc.color, borderColor: oc.border, background: oc.bg } : {}}
                                      onClick={() => togglePillar(selectedObj, pillar)}
                                    >
                                      {added ? 'Remove' : '+ Add'}
                                    </button>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                          {Array.from({ length: ITEMS_PER_PAGE - paginated.length }).map((_, i) => (
                            <tr key={`filler-${i}`} style={{ height: '52px' }}>
                              {selectMode && <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>}
                              <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                              <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                              <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                              {!selectMode && <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 }}>
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className="btn-sm"
                              style={pillarPage === page ? { background: '#0C447C', color: '#fff', borderColor: '#0C447C' } : {}}
                              onClick={() => setPillarPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}

            {hasCommits && (
              <div className="added-commitments">
                <div className="added-commitments__header">Your Selected Commitments</div>
                {OBJECTIVES.map((obj) => {
                  if (!pillarCommitments[obj].length) return null
                  const oc = OBJ_COLORS[obj]
                  return (
                    <div key={obj} className="added-group">
                      <div className="added-group__label" style={{ color: oc.color, background: oc.bg, border: `1px solid ${oc.border}` }}>{obj}</div>
                      <table className="tbl" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '28%' }}>Pillar</th>
                            <th style={{ width: '38%' }}>Performance Indicator</th>
                            <th style={{ width: '10%' }}>Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pillarCommitments[obj].map((p) => (
                            <tr key={p.id}>
                              <td className="t-name">{p.name}</td>
                              <td className="t-muted">{p.indicator}</td>
                              <td><button className="btn-sm btn-danger" onClick={() => togglePillar(obj, p)}>Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button type="button" className="btn-cancel" onClick={() => setStep(1)}>
                <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
                Back
              </button>
              <button
                type="button"
                className="btn-save"
                disabled={!allObjectivesFilled}
                onClick={() => setStep(3)}
              >
                Next <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </>
      )}

        {/* ── Success Modal ── */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 16, padding: '8px 0 16px', textAlign: 'center'
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#E1F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="1.8" width="32" height="32">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12l3 3 5-5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>
                    PCR Generated Successfully!
                  </div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                    Your PCR for <strong>{form.period}</strong> has been saved.<br/>
                    You can now download it as PDF or Excel.
                  </div>
                </div>
               <button
                className="btn-save"
                style={{ width: '100%' }}
                onClick={() => {  
                  setShowSuccessModal(false)
                  if (createdPCR && onViewPCR) {
                    onViewPCR(createdPCR)
                  }
                  reset()
                }}
              >
                View
              </button>
              </div>
            </div>
          </div>
        )}

      {/* ══ STEP 3: Review Generated PCR ══ */}
      {step === 3 && (
        <>
          <div className="pcr-summary-strip">
            {[
              { label: 'Name',     value: form.name       },
              { label: 'Position', value: form.position   },
              { label: 'Division', value: form.department },
              { label: 'Period',   value: form.period     },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'contents' }}>
                <div className="pcr-summary-item">
                  <span className="pcr-summary-label" style={{ fontWeight: 'bold' }}>{item.label}</span>
                  <span className="pcr-summary-value" style={{ fontWeight: 'bold' }}>{item.value}</span>
                </div>
                {i < arr.length - 1 && <div className="pcr-summary-divider" />}
              </div>
            ))}
          </div>

          {OBJECTIVES.map((obj) => {
            if (!pillarCommitments[obj].length) return null
            const oc = OBJ_COLORS[obj]
            return (
              <div key={obj} className="card" style={{ marginBottom: 0 }}>
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="added-group__label" style={{ color: oc.color, background: oc.bg, border: `1px solid ${oc.border}`, margin: 0 }}>
                      {obj}
                    </span>
                    Performance Commitments
                  </div>
                </div>
                <table className="tbl" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Pillar / KRA</th>
                      <th style={{ width: '38%' }}>Performance Indicator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillarCommitments[obj].map((p) => (
                      <tr key={p.id}>
                        <td className="t-name">{p.name}</td>
                        <td className="t-muted">{p.indicator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          <div className="pcr-review-notice">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="8" cy="8" r="7"/><path d="M8 7v5M8 5v.5"/>
            </svg>
            <span>Your PCR has been generated successfully for <strong>{form.period}</strong>. Ratings will be filled in during the evaluation period.</span>
          </div>

          <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={() => setStep(2)}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
            Edit
          </button>
          <button
            type="button"
            className="btn-save"
            disabled={submitting}
            onClick={handleGenerate}
          >
            {submitting ? 'Generating...' : '📄 Generate PCR'}
          </button>
        </div>
        </>
      )}
    </>
  )
}