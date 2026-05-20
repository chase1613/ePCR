import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { FadeLoader } from 'react-spinners'
import axios from 'axios'
import './LoginPage.css'

const loginUser = async ({ email, password }) => {
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/login`,
    { email, password }
  )
  return data
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]                 = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState({})
  const [deactivatedModal, setDeactivatedModal] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    mutation.reset()
  }

  const validate = () => {
    const errs = {}
    if (!form.email.trim())    errs.email    = 'Please enter your email or employee ID.'
    if (!form.password.trim()) errs.password = 'Please enter your password.'
    return errs
  }

  const mutation = useMutation({
  mutationFn: loginUser,
  onSuccess: (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    if (data.user.role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate('/user/dashboard')
    }
  },
  onError: (err) => {
  const msg = err.response?.data?.message?.toLowerCase() || ''
  if (err.response?.status === 403 || msg.includes('deactivated')) {
    setDeactivatedModal(true)
    }
  },
})

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) return setErrors(errs)
    mutation.mutate({ email: form.email, password: form.password })
  }

  const isReady = form.email.trim() && form.password.trim()

  return (
    <div className="login-wrap">

      {/* ── Background Image ── */}
      <img src="/kickoff_1.jpg" alt="" className="login-bg" />  {/* 👈 update filename */}


            {/* Card */}
      <div className="login-card">

        {/* Blue Header */}
        <div className="login-card-header">
              <img
              src="/fav.png"
              alt="CSC Logo"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
              }}
           />
          <div>
            <p className="login-card-header-title">
              2026 (EPCR) Electronic Performance Commitment Review
            </p>
            <p className="login-card-header-sub">Civil Service Commission Region VI</p>
          </div>
        </div>

        {/* Body */}
        <div className="login-card-body">
          <h3>Log in</h3>

          <form onSubmit={handleSubmit} noValidate>

            <div className="field">
              <label htmlFor="email">Email or employee ID</label>
              <input
                id="email"
                name="email"
                type="text"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Your password</label>
              <div className="password-row">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="hide-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      <line x1="2" y1="2" x2="14" y2="14"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      <circle cx="8" cy="8" r="2"/>
                    </svg>
                  )}
                  {showPassword ? 'Show' : 'Hide'}
                </button>
              </div>
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            {mutation.isError && !deactivatedModal && (
              <div className="server-error">
                {mutation.error?.response?.data?.message || 'Invalid credentials. Please try again.'}
              </div>
            )}

            <button
              type="submit"
              className={`login-btn ${isReady || mutation.isPending ? 'ready' : ''}`}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="btn-spinner">
                  <FadeLoader
                    color="#ffffff"
                    height={8}
                    width={2}
                    radius={2}
                    margin={-6}
                  />
                </span>
              ) : (
                'Log in'
              )}
            </button>

          </form>

          <div className="links-row">
            <button onClick={() => navigate('/forgot-password')} className="fp-link-btn">
              Forgot password?
            </button>
          </div>

        </div>

            {/* Footer */}
          <footer className="login-footer">
            <a href="https://csc.gov.ph/regional-offices/region-vi/about-us" target="_blank" rel="noopener noreferrer">
              About Us
            </a>
            <span className="footer-dot">·</span>
            <a href="https://www.csc.gov.ph/programs/public-assistance" target="_blank" rel="noopener noreferrer">
            Help Center
            </a>
            <span className="footer-dot">·</span>
            <a href="https://www.csc.gov.ph/about/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
            </a>
            <span className="footer-dot">·</span>
            <span>©{new Date().getFullYear()} Civil Service Commission Region 6</span>
          </footer>
      </div>

      {deactivatedModal && createPortal(
  <div className="modal-overlay" onClick={() => setDeactivatedModal(false)}>
    <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Account Deactivated</h2>
        <button className="modal-close" onClick={() => setDeactivatedModal(false)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l10 10M13 3L3 13"/>
          </svg>
        </button>
      </div>
      <div style={{ padding: '0 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="1.8" width="26" height="26">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p style={{ margin: 0, color: '#444', fontSize: 14, lineHeight: 1.6 }}>
          This account is currently deactivated.<br/>
          Please contact your admin to reactivate it.
        </p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center' }}>
        <button className="btn-save" onClick={() => setDeactivatedModal(false)}>
          OK, Got it
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
    </div>
  )
}