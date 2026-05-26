import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

const PROFILE_FIELDS = [
  { label: 'Full Name',     key: 'name',       type: 'text',  placeholder: 'Your full name'       },
  { label: 'Email Address', key: 'email',       type: 'email', placeholder: 'your@email.com'       },
  { label: 'Department',    key: 'department',  type: 'text',  placeholder: 'e.g. Human Resources' },
  { label: 'Position',      key: 'position',    type: 'text',  placeholder: 'e.g. HR Officer'      },
]

const PW_RULES = [
  { label: '8+ characters', test: (pw) => pw.length >= 8           },
  { label: 'Uppercase',     test: (pw) => /[A-Z]/.test(pw)         },
  { label: 'Number',        test: (pw) => /\d/.test(pw)            },
  { label: 'Symbol',        test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

const EyeIcon = ({ open }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
    <circle cx="8" cy="8" r="2"/>
    {!open && <path d="M2 2l12 12"/>}
  </svg>
)

const getInitialProfile = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    name:       user.name       || '',
    email:      user.email      || '',
    department: user.department || '',
    position:   user.position   || '',
  }
}

// ── Fetcher ──
const changePasswordFn = async ({ currentPassword, newPassword }) => {
  const token = localStorage.getItem('token')
  const { data } = await axios.patch(
    `${API}/auth/change-password`,
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}

const emptyPwForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function UserProfile() {
  const [profile,     setProfile]     = useState(getInitialProfile)
  const [editMode,    setEditMode]    = useState(false)
  const [draft,       setDraft]       = useState(profile)
  const [profileMsg,  setProfileMsg]  = useState({ text: '', type: '' })

  const [pwMode,      setPwMode]      = useState(false)
  const [pwForm,      setPwForm]      = useState(emptyPwForm)
  const [pwErrors,    setPwErrors]    = useState({})
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)


  // ── Message helper ──
  const showMsg = (text, type = 'success') => {
    setProfileMsg({ text, type })
    setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000)
  }

  // ── Profile handlers ──
  const handleEdit = useCallback(() => {
    setDraft(profile)
    setEditMode(true)
    setProfileMsg({ text: '', type: '' })
  }, [profile])

  const handleCancel = useCallback(() => {
    setDraft(profile)
    setEditMode(false)
    setProfileMsg({ text: '', type: '' })
  }, [profile])

  // ── Replace handleSave with this ──
  const handleSave = (e) => {
  e.preventDefault()
  if (!draft.name.trim() || !draft.email.trim()) {
    showMsg('Name and email are required.', 'error')
    return
  }
  updateProfileMutation.mutate(draft)
}

  // ── Change Password Mutation ──
  const changePasswordMutation = useMutation({
    mutationFn: changePasswordFn,
    onSuccess: () => {
      setPwForm(emptyPwForm)
      setPwMode(false)
      showMsg('Password changed successfully.')
    },
    onError: (err) => {
  const msg = err.response?.data?.message || 'Failed to change password.'
    if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
      setPwErrors({ currentPassword: msg })
    } else {
      setPwErrors({ newPassword: msg })
    }
  },
  })

  // ── Password handlers ──
  const handlePwChange = (e) => {
    const { name, value } = e.target
    setPwForm((prev) => ({ ...prev, [name]: value }))
    setPwErrors((prev) => ({ ...prev, [name]: '' }))
    changePasswordMutation.reset()
  }

  const validatePassword = () => {
  const errs = {}
  if (!pwForm.currentPassword)
    errs.currentPassword = 'Please enter your current password.'
  if (!pwForm.newPassword)
    errs.newPassword = 'Please enter a new password.'
  else if (!PW_RULES.every((r) => r.test(pwForm.newPassword)))
    errs.newPassword = 'Password does not meet all requirements.'
  if (!pwForm.confirmPassword)
    errs.confirmPassword = 'Please confirm your new password.'
  else if (pwForm.newPassword !== pwForm.confirmPassword)
    errs.confirmPassword = 'Passwords do not match.'
  return errs
}

    const handlePwSave = (e) => {
    e.preventDefault()
    const errs = validatePassword()
    if (Object.keys(errs).length) return setPwErrors(errs)
    changePasswordMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    })
  }

  const handlePwCancel = () => {
    setPwForm(emptyPwForm)
    setPwErrors({})
    setShowNew(false)
    setShowConfirm(false)
    setShowCurrent(false)
    setPwMode(false)
    changePasswordMutation.reset()
  }

  const displayValue = (key) => profile[key] || '—'

  const updateProfileFn = async (profileData) => {
  const token = localStorage.getItem('token')
  const { data } = await axios.patch(
    `${API}/auth/update-profile`,
    profileData,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}

  // ── Add this mutation inside the component ──
const updateProfileMutation = useMutation({
  mutationFn: updateProfileFn,
  onSuccess: (data) => {
    // Update localStorage with new user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const updatedUser = { ...currentUser, ...draft }
    localStorage.setItem('user', JSON.stringify(updatedUser))

    setProfile(draft)
    setEditMode(false)
    showMsg('Profile updated successfully.')
  },
  onError: (err) => {
    showMsg(err.response?.data?.message || 'Failed to update profile.', 'error')
  },
})

  return (
    <>
      {/* Ionicons CDN */}
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <script noModule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>

      <div className="main-header">
        <div>
          <h1 className="main-title">My Profile</h1>
          <p className="page-sub">View and manage your account information</p>
        </div>
      </div>

      {/* ── Avatar Card ── */}
      <div className="profile-hero">
        <div className="profile-hero__avatar">{getInitials(profile.name)}</div>
        <div className="profile-hero__info">
          <div className="profile-hero__name">{profile.name || 'Employee'}</div>
          <div className="profile-hero__email">{profile.email}</div>
          <div className="profile-hero__meta">
            <span className="sb-user-role">Employee</span>
            {profile.department && <span className="profile-hero__dept">· {profile.department}</span>}
            {profile.position   && <span className="profile-hero__dept">· {profile.position}</span>}
          </div>
        </div>
        {!editMode && !pwMode && (
          <button className="btn-edit-profile" onClick={handleEdit}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
            </svg>
            Edit profile
          </button>
        )}
      </div>

      {/* ── Flash message ── */}
      {profileMsg.text && (
        <div className={`server-${profileMsg.type}`}>{profileMsg.text}</div>
      )}

      {/* ── Account Details Card ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Account Details</div>
          {editMode && <span className="edit-mode-badge">Editing</span>}
        </div>

        {/* VIEW MODE */}
        {!editMode && (
          <div className="profile-fields">
            {PROFILE_FIELDS.map((f) => (
              <div key={f.key} className="profile-field">
                <div className="profile-field__label">{f.label}</div>
                <div className="profile-field__value">{displayValue(f.key)}</div>
              </div>
            ))}
          </div>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <form onSubmit={handleSave} noValidate>
            <div className="form-grid-2">
              {PROFILE_FIELDS.map((f) => (
                <div className="form-row" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn-save">Save changes</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Change Password Card ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Password</div>
          {pwMode && <span className="edit-mode-badge">Editing</span>}
        </div>

        {/* VIEW MODE */}
        {!pwMode && (
        <div className="profile-fields">
          <div className="profile-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
            <div>
              <div className="profile-field__label">Current password</div>
              <div className="profile-field__value">••••••••</div>
            </div>
            {!editMode && (
              <button
                className="card-action"
                onClick={() => setPwMode(true)}
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '8px 20px',
                  border:       '1px solid currentColor',
                  borderRadius: '8px',
                  fontSize:     '13px',
                  fontWeight:   '500',
                  cursor:       'pointer',
                  background:   'transparent',
                }}
              >
                <ion-icon name="lock-closed-outline" style={{ fontSize: '15px' }} />
                Change password
              </button>
            )}
          </div>
        </div>
      )}

        {/* EDIT MODE */}
        {pwMode && (
          <form onSubmit={handlePwSave} noValidate>

            
           {/* ── Current Password ── */}
      <div className="form-row" style={{ marginBottom: 16, maxWidth: '50%' }}>
        <label className="form-label">Current Password</label>
        <div className="input-wrap">
          <input
            className={`form-input ${pwErrors.currentPassword ? 'input-error' : ''}`}
            type={showCurrent ? 'text' : 'password'}
            name="currentPassword"
            placeholder="Enter your current password"
            value={pwForm.currentPassword}
            onChange={handlePwChange}
            autoFocus
          />
          <button type="button" className="pw-toggle" onClick={() => setShowCurrent((v) => !v)}>
            <EyeIcon open={showCurrent} />
          </button>
        </div>
        {pwErrors.currentPassword && (
          <span className="field-error">{pwErrors.currentPassword}</span>
        )}
      </div>

            <div className="form-grid-2">

              {/* New Password */}
              <div className="form-row">
                <label className="form-label">New Password</label>
                <div className="input-wrap">
                  <input
                    className={`form-input ${pwErrors.newPassword ? 'input-error' : ''}`}
                    type={showNew ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="At least 8 characters"
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    autoFocus
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowNew((v) => !v)}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
                {pwErrors.newPassword && (
                  <span className="field-error">{pwErrors.newPassword}</span>
                )}

                {/* Strength rules */}
                {pwForm.newPassword && (
                  <div className="pw-strength" style={{ marginTop: 8 }}>
                    {PW_RULES.map((r) => {
                      const pass = r.test(pwForm.newPassword)
                      return (
                        <div
                          key={r.label}
                          className={`pw-strength__rule ${pass ? 'pw-strength__rule--pass' : ''}`}
                        >
                          <span>{pass ? '✓' : '○'}</span> {r.label}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-row">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrap">
                  <input
                    className={`form-input ${pwErrors.confirmPassword ? 'input-error' : ''}`}
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter your new password"
                    value={pwForm.confirmPassword}
                    onChange={handlePwChange}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowConfirm((v) => !v)}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {pwErrors.confirmPassword && (
                  <span className="field-error">{pwErrors.confirmPassword}</span>
                )}

                {/* Match indicator */}
                {pwForm.confirmPassword && (
                  <div
                    className={`pw-strength__rule ${pwForm.newPassword === pwForm.confirmPassword ? 'pw-strength__rule--pass' : ''}`}
                    style={{ marginTop: 8 }}
                  >
                    <span>{pwForm.newPassword === pwForm.confirmPassword ? '✓' : '○'}</span> Passwords match
                  </div>
                )}
              </div>

            </div>

            {/* In the edit mode form footer — update the save button */}
            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={handlePwCancel}
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}