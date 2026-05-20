import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/layout/Sidebar'
import './ManageUsers.css'
import uFuzzy from '@leeoniya/ufuzzy'
import { useQueryClient } from '@tanstack/react-query'

const API      = import.meta.env.VITE_API_URL
const PAGE_SIZE = 10
const uf        = new uFuzzy({ intraIns: 1 })

export default function ManageUsers() {
  const currentUser = JSON.parse(localStorage.getItem('user'))
  const token       = localStorage.getItem('token')

  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [roleFilter,    setRoleFilter]    = useState('all')
  const [statFilter,    setStatFilter]    = useState('all')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [showModal,     setShowModal]     = useState(false)
  const [editUser,      setEditUser]      = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [serverMsg,     setServerMsg]     = useState('')
  const [serverErr,     setServerErr]     = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [toggleTarget,  setToggleTarget]  = useState(null)
  const [toggling,      setToggling]      = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    full_name: '', employee_id: '', email: '',
    department: '', position: '', role: 'user', password: '',
  })
  const [formErrors, setFormErrors] = useState({})

  const authHeaders  = { headers: { Authorization: `Bearer ${token}` } }
  const queryClient  = useQueryClient()

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // ── Fetch users ──
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API}/auth/users`, authHeaders)
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Reset page on filter/search change ──
  useEffect(() => { setCurrentPage(1) }, [search, roleFilter, statFilter])

  // ── Open modal ──
  const openCreate = () => {
    setEditUser(null)
    setForm({ full_name: '', employee_id: '', email: '', department: '', position: '', role: 'user', password: generatePassword() })
    setFormErrors({})
    setServerMsg('')
    setServerErr('')
    setShowModal(true)
    setShowPassword(false)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({
      full_name:   u.name,
      employee_id: u.employee_id,
      email:       u.email,
      department:  u.department || '',
      position:    u.position   || '',
      role:        u.role,
      password:    '',
    })
    setFormErrors({})
    setServerMsg('')
    setServerErr('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditUser(null)
  }

  // ── Validate ──
  const validate = () => {
    const errs = {}

    const nameRules = [
      [!form.full_name.trim(),                                                                      'Required'],
      [!/^[a-zA-Z\s.,'\-]+$/.test(form.full_name.trim()),                                          'Name should contain letters only'],
      [form.full_name.trim().split(/\s+/).length < 2,                                               'Please enter full name (first and last name)'],
      [form.full_name.trim().split(/\s+/).some((w) => w.replace(/[.,'\-]/g, '').length < 2 && !/^[A-Z]\.$/.test(w)), 'Each name part must be at least 2 characters to proceed'],
      [/(.)\1{2,}/.test(form.full_name.trim()),                                                     'Name appears to be invalid'],
    ]
    const nameErr = nameRules.find(([condition]) => condition)
    if (nameErr) errs.full_name = nameErr[1]

    const empRules = [
      [!form.employee_id.trim(),                   'Required'],
      [!/^EMP-\d+$/.test(form.employee_id.trim()), 'Format must be EMP-[numbers] e.g. EMP-001'],
    ]
    const empErr = empRules.find(([condition]) => condition)
    if (empErr) errs.employee_id = empErr[1]

    const emailRules = [
      [!form.email.trim(),                                           'Required'],
      [!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),       'Please enter a valid email address'],
    ]
    const emailErr = emailRules.find(([condition]) => condition)
    if (emailErr) errs.email = emailErr[1]

    if (!form.department) errs.department = 'Required'
    if (!form.position)   errs.position   = 'Required'
    if (!editUser && !form.password.trim()) errs.password = 'Required'

    return errs
  }

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) return setFormErrors(errs)

    try {
      setSubmitting(true)
      setServerErr('')

      if (editUser) {
        await axios.put(`${API}/auth/users/${editUser.id}`, {
          name:       form.full_name,
          email:      form.email,
          department: form.department,
          position:   form.position,
          role:       form.role,
        }, authHeaders)
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        setServerMsg('User updated successfully.')
      } else {
        await axios.post(`${API}/auth/users`, {
          employee_id: form.employee_id,
          name:        form.full_name,
          email:       form.email,
          department:  form.department,
          position:    form.position,
          role:        form.role,
          password:    form.password,
        }, authHeaders)
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        setServerMsg('User created successfully.')
      }
      fetchUsers()
      setTimeout(() => closeModal(), 1200)
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle active ──
  const handleToggle = async () => {
  try {
    setToggling(true)
    await axios.patch(`${API}/auth/users/${toggleTarget.id}/toggle`, {}, authHeaders)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === toggleTarget.id ? { ...u, is_active: !u.is_active } : u
      )
    )
    setToggleTarget(null)
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to update status.', 'error')
  } finally {
    setToggling(false)
  }
}

  // ── Filter + uFuzzy search ──
  const roleStatFiltered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStat = statFilter === 'all' ||
      (statFilter === 'active'   && u.is_active) ||
      (statFilter === 'inactive' && !u.is_active)
    return matchRole && matchStat
  })

  const filtered = (() => {
    if (!search.trim()) return roleStatFiltered
    const haystack = roleStatFiltered.map((u) => `${u.name} ${u.email} ${u.employee_id}`)
    const [idxs, info, order] = uf.search(haystack, search)
    if (!idxs || idxs.length === 0) return []
    return (order || idxs).map((i) => roleStatFiltered[idxs[i] ?? i])
  })()

  // ── Pagination ──
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const avatarColors = [
    { bg: '#E6F1FB', color: '#0C447C' },
    { bg: '#E1F5EE', color: '#085041' },
    { bg: '#FAEEDA', color: '#633806' },
    { bg: '#EEEDFE', color: '#3C3489' },
    { bg: '#FAECE7', color: '#712B13' },
  ]
  const getColor = (id) => avatarColors[id % avatarColors.length]

  const showToast = (message, type = 'success') => {
  setToast({ message, type })
  setTimeout(() => setToast(null), 3000)
}

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">

        {toast && (
          <div className={`toast toast--${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.message}
          </div>
        )}

        <div className="page-header">
          <h1 className="page-title">Manage users</h1>
          <button className="btn-primary" onClick={openCreate}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M3 8h10"/>
            </svg>
            Add new user
          </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <input
            className="search-box"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="user">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <select className="filter-select" value={statFilter} onChange={(e) => setStatFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="table-empty">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">No users found.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '4%'  }}>#</th>
                  <th style={{ width: '26%' }}>Employee</th>
                  <th style={{ width: '14%' }}>Employee ID</th>
                  <th style={{ width: '16%' }}>Department</th>
                  <th style={{ width: '12%' }}>Position</th>
                  <th style={{ width: '9%'  }}>Role</th>
                  <th style={{ width: '9%'  }}>Status</th>
                  <th style={{ width: '14%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, index) => {
                  const c = getColor(u.id)
                  return (
                    <tr key={u.id}>
                      <td className="t-muted" style={{ textAlign: 'center' }}>
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td>
                        <div className="t-name-cell">
                          <div className="t-avatar" style={{ background: c.bg, color: c.color }}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="t-name">{u.name}</div>
                            <div className="t-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="t-muted">{u.employee_id}</td>
                      <td className="t-muted">{u.department || '—'}</td>
                      <td className="t-muted">{u.position   || '—'}</td>
                      <td>
                        <span className={`badge badge-${u.role}`}>
                          {u.role === 'admin' ? 'Admin' : 'Employee'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.is_active ? 'active' : 'inactive'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="t-actions">
                          <button className="btn-sm" onClick={() => openEdit(u)}>Edit</button>
                          {u.id !== currentUser?.id && (
                            <button
                              className={`btn-sm ${u.is_active ? 'btn-danger' : 'btn-activate'}`}
                              onClick={() => setToggleTarget(u)}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '12px 0' }}>
            <button className="pagination__btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pagination__btn ${currentPage === p ? 'pagination__btn--active' : ''}`}
                style={currentPage === p ? { background: '#185FA5', color: '#fff', borderColor: '#185FA5' } : {}}
                onClick={() => setCurrentPage(p)}
              >{p}</button>
            ))}
            <button className="pagination__btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>›</button>
          </div>
        )}

        {/* Footer */}
        <div className="table-footer">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} users
        </div>

      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? 'Edit user' : 'Add new user'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <label className="form-label">Full name</label>
                <input
                  className={`form-input ${formErrors.full_name ? 'input-error' : ''}`}
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                {formErrors.full_name && <span className="field-error">{formErrors.full_name}</span>}
              </div>

              <div className="form-row">
                <label className="form-label">Employee ID</label>
                <input
                  className={`form-input ${formErrors.employee_id ? 'input-error' : ''}`}
                  placeholder="e.g. EMP-001"
                  value={form.employee_id}
                  disabled={!!editUser}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                />
                {formErrors.employee_id && <span className="field-error">{formErrors.employee_id}</span>}
              </div>

              <div className="form-row">
                <label className="form-label">Email address</label>
                <input
                  className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                  type="email"
                  placeholder="e.g. juan@csc.gov.ph"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label className="form-label">Department</label>
                  <select
                    className={`form-select ${formErrors.department ? 'input-error' : ''}`}
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option>ANTI-RED TAPE UNIT</option>
                    <option>EXAMINATION RESOURCE DIVISION</option>
                    <option>HUMAN RESOURCE DIVISION</option>
                    <option>LEGAL SERVICES DIVISION</option>
                    <option>MANAGEMENT SERVICES DIVISION</option>
                    <option>OFFICE OF THE REGIONAL DIVISION</option>
                    <option>PUBLIC ASSISTANCE AND LIASON DIVISION</option>
                    <option>POLICIES AND SYSTEMS EVALUATION DIVISION</option>
                    <option>CSC FIELD OFFICE OF AKLAN</option>
                    <option>CSC FIELD OFFICE OF ANTIQUE</option>
                    <option>CSC FIELD OFFICE OF CAPIZ</option>
                    <option>CSC FIELD OFFICE OF GUIMARAS</option>
                    <option>CSC FIELD OFFICE OF ILOILO</option>
                    <option>CSC FIELD OFFICE OF NEGROS ISLAND REGION</option>
                  </select>
                  {formErrors.department && <span className="field-error">{formErrors.department}</span>}
                </div>

                <div className="form-row">
                  <label className="form-label">Position</label>
                  <select
                    className={`form-select ${formErrors.position ? 'input-error' : ''}`}
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  >
                    <option value="">Select Position</option>
                    <option>ACCOUNTANT III</option>
                    <option>ADMINISTRATIVE AIDE III</option>
                    <option>ADMINISTRATIVE AIDE IV</option>
                    <option>ADMINISTRATIVE AIDE V</option>
                    <option>ADMINISTRATIVE AIDE VI</option>
                    <option>ADMINISTRATIVE ASSISTANT II</option>
                    <option>ADMINISTRATIVE ASSISTANT III</option>
                    <option>ADMINISTRATIVE OFFICER II</option>
                    <option>ADMINISTRATIVE OFFICER IV</option>
                    <option>ADMINISTRATIVE OFFICER V</option>
                    <option>ATTORNEY III</option>
                    <option>ATTORNEY IV</option>
                    <option>ATTORNEY V</option>
                    <option>ATTORNEY VI</option>
                    <option>CHIEF HUMAN RESOURCE SPECIALIST</option>
                    <option>DIRECTOR II</option>
                    <option>DIRECTOR III</option>
                    <option>DIRECTOR IV</option>
                    <option>HUMAN RESOURCE SPECIALIST I</option>
                    <option>HUMAN RESOURCE SPECIALIST II</option>
                    <option>OIC - CHIEF HUMAN RESOURCE SPECIALIST</option>
                    <option>SENIOR HUMAN RESOURCE SPECIALIST</option>
                    <option>SPECIAL INVESTIGATOR II</option>
                    <option>SPECIAL INVESTIGATOR III</option>
                    <option>SUPERVISING HUMAN RESOURCE SPECIALIST</option>
                  </select>
                  {formErrors.position && <span className="field-error">{formErrors.position}</span>}
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {!editUser && (
                <div className="form-row">
                  <label className="form-label">Temporary password</label>
                  <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className={`form-input ${formErrors.password ? 'input-error' : ''}`}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Set initial password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%',
                          transform: 'translateY(-50%)', background: 'none',
                          border: 'none', cursor: 'pointer', color: '#888', padding: 0,
                        }}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, password: generatePassword() })}
                      style={{
                        padding: '0 12px', borderRadius: '8px', border: '1px solid #d0d5dd',
                        background: '#f9fafb', cursor: 'pointer', color: '#555',
                        fontSize: '13px', whiteSpace: 'nowrap', display: 'flex',
                        alignItems: 'center', gap: '6px',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                        <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0 1 14.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  {formErrors.password && <span className="field-error">{formErrors.password}</span>}
                </div>
              )}

              {serverErr && <div className="server-error">{serverErr}</div>}
              {serverMsg && <div className="server-success">{serverMsg}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : editUser ? 'Save changes' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toggle Active/Inactive Modal ── */}
      {toggleTarget && (
        <div className="modal-overlay" onClick={() => setToggleTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ textAlign: 'center', flex: 1 }}>
                {toggleTarget.is_active ? 'Deactivate Account' : 'Activate Account'}
              </h2>
              <button className="modal-close" onClick={() => setToggleTarget(null)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '0 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: toggleTarget.is_active ? '#FAECE7' : '#E1F5EE',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {toggleTarget.is_active ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="1.8" width="26" height="26">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="1.8" width="26" height="26">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                )}
              </div>
              <p style={{ margin: 0, color: '#444', fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to{' '}
                <strong>{toggleTarget.is_active ? 'deactivate' : 'activate'}</strong> the account of{' '}
                <strong>{toggleTarget.name}</strong>?
                {toggleTarget.is_active && (
                  <><br/><span style={{ color: '#888', fontSize: 13 }}>They will no longer be able to log in.</span></>
                )}
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center', gap: 10 }}>
              <button className="btn-cancel" onClick={() => setToggleTarget(null)}>Cancel</button>
              <button
                className={toggleTarget.is_active ? 'btn-delete' : 'btn-save'}
                onClick={handleToggle}
                disabled={toggling}
              >
                {toggling ? 'Updating...' : toggleTarget.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}