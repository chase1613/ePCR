import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { FadeLoader } from 'react-spinners'
import axios from 'axios'
import './ForgotPassword.css'

const API   = import.meta.env.VITE_API_URL
const STEPS = [
  { label: 'Email Verification' },
  { label: 'OTP Confirmation'   },
  { label: 'Reset Password'     },
]

// ── Fetcher functions ──
const sendOtp    = ({ email })                  => axios.post(`${API}/forgot-password/send-otp`,      { email })
const verifyOtp  = ({ email, token })           => axios.post(`${API}/forgot-password/verify-otp`,    { email, token })
const resetPassword = ({ email, newPassword })  => axios.post(`${API}/forgot-password/reset-password`, { email, newPassword })

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step,        setStep]        = useState(1)
  const [email,       setEmail]       = useState('')
  const [emailError,  setEmailError]  = useState('')
  const [otp,         setOtp]         = useState(['', '', '', '', '', ''])
  const [otpError,    setOtpError]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [pwErrors,    setPwErrors]    = useState({})
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done,        setDone]        = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
  if (resendCooldown <= 0) return
  const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
  return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
        document.title = 'Forgot Password | ePCR'
        return () => { document.title = 'ePCR' }
      }, [])

  // ── Step 1: Send OTP ──
  const sendOtpMutation = useMutation({
    mutationFn: sendOtp,
    onSuccess: () => {
      setStep(2)
    },
    onError: (err) => {
      setEmailError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    },
  })

  // ── Step 2: Verify OTP ──
  const verifyOtpMutation = useMutation({
      mutationFn: verifyOtp,
      onSuccess: () => {
        setStep(3)
      },
      onError: (err) => {
        const message = err.response?.data?.message || 'Invalid or expired OTP. Please try again.'
        setOtpError(message)
        if (err.response?.status === 429) {
          setIsBlocked(true)
        }
      },
    })

  // ── Step 2: Resend OTP ──
  const resendOtpMutation = useMutation({
    mutationFn: sendOtp,
    onMutate: () => {
      setOtp(['', '', '', '', '', ''])
      setOtpError('')
      setIsBlocked(false)
    },
    onSuccess: () => {
      document.getElementById('otp-0')?.focus()
      setResendCooldown(60)
    },
    onError: (err) => {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.')
    },
  })

  // ── Step 3: Reset Password ──
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setDone(true)
    },
    onError: (err) => {
      setPwErrors({ newPassword: err.response?.data?.message || 'Failed to reset password.' })
    },
  })

  // ── Step 1: Submit handler ──
  const handleEmailSubmit = (e) => {
    e.preventDefault()
    if (!email.trim())                return setEmailError('Please enter your email address.')
    if (!/\S+@\S+\.\S+/.test(email)) return setEmailError('Please enter a valid email address.')
    setEmailError('')
    sendOtpMutation.mutate({ email })
  }

  // ── Step 2: OTP input handlers ──
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx]  = val
    setOtp(next)
    setOtpError('')
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus()
  }

  // ── Step 2: Submit handler ──
  const handleOtpSubmit = (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setOtpError('Please enter the complete 6-digit OTP.')
    setOtpError('')
    verifyOtpMutation.mutate({ email, token: code })
  }

  // ── Step 3: Submit handler ──
  const handleResetSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!newPassword)                   errs.newPassword = 'Password is required.'
    else if (newPassword.length < 8)    errs.newPassword = 'Password must be at least 8 characters.'
    if (!confirmPw)                     errs.confirmPw   = 'Please confirm your password.'
    else if (newPassword !== confirmPw) errs.confirmPw   = 'Passwords do not match.'
    if (Object.keys(errs).length) return setPwErrors(errs)
    resetPasswordMutation.mutate({ email, newPassword })
  }

  return (
    <div className="login-page">
      <div className="login-card forgot-card">

        {/* ── Logo ── */}
        <div className="login-logo-wrap">
          <img src="/csc-logo.png" alt="CSC Logo" className="login-logo" />
          <div className="login-brand">
            <div className="login-brand-name">Civil Service Commission</div>
            <div className="login-brand-sub">Electronic Performance Commitment Review</div>
          </div>
        </div>

        {/* ── Success Screen ── */}
        {done ? (
          <div className="fp-success">
            <div className="fp-success__icon">✓</div>
            <div className="fp-success__title">Password Reset!</div>
            <div className="fp-success__sub">
              Your password has been updated successfully. You can now log in with your new password.
            </div>
            <button className="fp-back-btn" onClick={() => navigate('/login')}>
              <i className="fa-solid fa-right-to-bracket" /> Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="fp-header">
              <h1 className="fp-title">Forgot Password</h1>
              <p className="fp-sub">Follow the steps below to reset your password</p>
            </div>

            {/* ── Progress Bar ── */}
            <div className="fp-progress">
              {STEPS.map((s, i) => {
                const num      = i + 1
                const isDone   = step > num
                const isActive = step === num
                const isLast   = i === STEPS.length - 1
                return (
                  <div key={s.label} className="fp-progress__item">
                    <div className="fp-progress__track">
                      {i > 0
                        ? <div className={`fp-progress__line ${step > i ? 'fp-progress__line--done' : ''}`} />
                        : <div className="fp-progress__line fp-progress__line--invisible" />
                      }
                      <div className={`fp-progress__dot ${isDone ? 'fp-progress__dot--done' : ''} ${isActive ? 'fp-progress__dot--active' : ''}`}>
                        {isDone ? '✓' : num}
                      </div>
                      {!isLast
                        ? <div className={`fp-progress__line ${isDone ? 'fp-progress__line--done' : ''}`} />
                        : <div className="fp-progress__line fp-progress__line--invisible" />
                      }
                    </div>
                    <div className={`fp-progress__label ${isDone ? 'fp-progress__label--done' : ''} ${isActive ? 'fp-progress__label--active' : ''}`}>
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ══ STEP 1: Email ══ */}
            {step === 1 && (
              <form className="fp-form" onSubmit={handleEmailSubmit} noValidate>
                <div className="fp-step-info">
                  <div className="fp-step-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 7l10 7 10-7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="fp-step-title">Enter your email</div>
                    <div className="fp-step-desc">
                      We'll send a one-time password to your registered email address.
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">Email Address</label>
                  <input
                    className={`form-input ${emailError ? 'input-error' : ''}`}
                    type="email"
                    placeholder="e.g. juan@csc.gov.ph"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); sendOtpMutation.reset() }}
                    autoFocus
                  />
                  {emailError && <span className="field-error">{emailError}</span>}
                </div>

                <button type="submit" className="fp-submit-btn" disabled={sendOtpMutation.isPending}>
                  {sendOtpMutation.isPending
                    ? <span className="btn-spinner"><FadeLoader color="#ffffff" height={8} width={2} radius={2} margin={-6} /></span>
                    : 'Continue'
                  }
                </button>

                <button type="button" className="fp-link-btn" onClick={() => navigate('/login')}>
                  <i className="fa-solid fa-arrow-left" /> Back to Login
                </button>
              </form>
            )}

            {/* ══ STEP 2: OTP ══ */}
            {step === 2 && (
              <form className="fp-form" onSubmit={handleOtpSubmit} noValidate>
                <div className="fp-step-info">
                  <div className="fp-step-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <path d="M12 17v.5M9 11h6"/>
                    </svg>
                  </div>
                  <div>
                    <div className="fp-step-title">Check your email</div>
                    <div className="fp-step-desc">
                      We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below.
                    </div>
                  </div>
                </div>

                <div className="otp-wrap">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      className={`otp-input ${otpError ? 'input-error' : ''} ${digit ? 'otp-input--filled' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                {otpError && (
                  <span className="field-error" style={{ textAlign: 'center', display: 'block' }}>
                    {otpError}
                  </span>
                )}

                <button 
                  type="submit" 
                  className="fp-submit-btn" 
                  disabled={verifyOtpMutation.isPending || isBlocked}
                >
                  {verifyOtpMutation.isPending
                    ? <span className="btn-spinner"><FadeLoader color="#ffffff" height={8} width={2} radius={2} margin={-6} /></span>
                    : 'Verify OTP'
                  }
                </button>

                <div className="fp-resend">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    className="fp-link-btn fp-link-btn--inline"
                    onClick={() => resendOtpMutation.mutate({ email })}
                    disabled={resendOtpMutation.isPending || resendCooldown > 0}
                  >
                    <i className="fa-solid fa-rotate-right" />
                    {resendCooldown > 0
                      ? ` Resend OTP in ${resendCooldown}s`
                      : resendOtpMutation.isPending
                        ? ' Resending...'
                        : ' Resend OTP'
                    }
                  </button>
                </div>

                <button type="button" className="fp-link-btn" onClick={() => navigate('/login')}>
                  <i className="fa-solid fa-arrow-left" /> Back to Login
                </button>
              </form>
            )}

            {/* ══ STEP 3: New Password ══ */}
            {step === 3 && (
              <form className="fp-form" onSubmit={handleResetSubmit} noValidate>
                <div className="fp-step-info">
                  <div className="fp-step-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="11" width="14" height="10" rx="2"/>
                      <path d="M8 11V7a4 4 0 018 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="fp-step-title">Set new password</div>
                    <div className="fp-step-desc">Choose a strong password for your account.</div>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">New Password</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input ${pwErrors.newPassword ? 'input-error' : ''}`}
                      type={showNew ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwErrors({ ...pwErrors, newPassword: '' }) }}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowNew((v) => !v)}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                        {showNew
                          ? <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></>
                          : <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></>
                        }
                      </svg>
                    </button>
                  </div>
                  {pwErrors.newPassword && <span className="field-error">{pwErrors.newPassword}</span>}
                </div>

                <div className="form-row">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrap">
                    <input
                      className={`form-input ${pwErrors.confirmPw ? 'input-error' : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPw}
                      onChange={(e) => { setConfirmPw(e.target.value); setPwErrors({ ...pwErrors, confirmPw: '' }) }}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirm((v) => !v)}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                        {showConfirm
                          ? <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></>
                          : <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></>
                        }
                      </svg>
                    </button>
                  </div>
                  {pwErrors.confirmPw && <span className="field-error">{pwErrors.confirmPw}</span>}
                </div>

                {newPassword && (
                  <div className="pw-strength">
                    {[
                      { label: '8+ characters', pass: newPassword.length >= 8           },
                      { label: 'Uppercase',     pass: /[A-Z]/.test(newPassword)         },
                      { label: 'Number',        pass: /\d/.test(newPassword)            },
                      { label: 'Symbol',        pass: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((r) => (
                      <div key={r.label} className={`pw-strength__rule ${r.pass ? 'pw-strength__rule--pass' : ''}`}>
                        <span>{r.pass ? '✓' : '○'}</span> {r.label}
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" className="fp-submit-btn" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending
                    ? <span className="btn-spinner"><FadeLoader color="#ffffff" height={8} width={2} radius={2} margin={-6} /></span>
                    : 'Reset Password'
                  }
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}