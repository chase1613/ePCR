const rateLimit        = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again after 15 minutes.',
    })
  },
})


// ── Forgot Password Rate Limiter ──
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req, res) => {
    const email = req.body?.email || 'unknown'
    return `${ipKeyGenerator(req, res)}_${email.toLowerCase()}`
  },

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password reset attempts. Please try again after 60 minutes.',
    })
  },
})

// ── OTP Verify Rate Limiter ──
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req, res) => {
    const email = req.body?.email || 'unknown'
    return `${ipKeyGenerator(req, res)}_${email.toLowerCase()}_verify`
  },

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many OTP attempts. Please request a new OTP and try again.',
    })
  },
})

module.exports = { forgotPasswordLimiter, otpVerifyLimiter, loginLimiter }