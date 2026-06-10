const supabase      = require('../config/supabase')
const bcrypt        = require('bcryptjs')
const { Resend }    = require('resend')
const emailTemplate = require('../utils/emailTemplate')

const resend   = new Resend(process.env.RESEND_API_KEY)
const otpStore = new Map()  // { email: { otp, expires, attempts } }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── Step 1: Send OTP ──
exports.sendOTP = async (req, res) => {
  const { email } = req.body

  try {
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_active, name')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return res.status(404).json({ message: 'If an account exists with that email, we have sent a password reset link to it.' })
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated.' })
    }

    // Check if there's an existing OTP — only block if resend cooldown is active (60s)
      const existing = otpStore.get(email.toLowerCase())
      if (existing && Date.now() < existing.resendAllowedAt) {
        const secondsLeft = Math.ceil((existing.resendAllowedAt - Date.now()) / 1000)
        return res.status(429).json({
          message: `Please wait ${secondsLeft} second(s) before requesting a new OTP.`,
        })
      }

      // Generate OTP — expires in 15 minutes, resend allowed after 60s
      const otp             = generateOTP()
      const expires         = Date.now() + 15 * 60 * 1000
      const resendAllowedAt = Date.now() + 60 * 1000
      otpStore.set(email.toLowerCase(), { otp, expires, resendAllowedAt, attempts: 0 })

      // Send email — always use the stored lowercase email
      await resend.emails.send({
        from:    'ePCR CSC <onboarding@resend.dev>',
        to:      user.email,
        subject: 'Your ePCR Password Reset OTP',
        html:    emailTemplate(user.name, otp),
      })

      res.status(200).json({ message: 'OTP sent to your email. It expires in 15 minutes.' })

    } catch (err) {
      console.error('sendOTP error:', err.message)
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' })
    }
  }

// ── Step 2: Verify OTP ──
exports.verifyOTP = async (req, res) => {
  const { email, token } = req.body

  try {
    if (!email || !token) {
      return res.status(400).json({ message: 'Email and OTP are required.' })
    }

    const stored = otpStore.get(email.toLowerCase())

    if (!stored) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' })
    }

    // Check expiry (15 min)
    if (Date.now() > stored.expires) {
      otpStore.delete(email.toLowerCase())
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' })
    }

    // Track failed attempts — block after 3 wrong tries
    if (stored.attempts >= 3) {
      otpStore.delete(email.toLowerCase())
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      })
    }

    if (stored.otp !== token) {
      // Increment attempts
      stored.attempts += 1
      otpStore.set(email.toLowerCase(), stored)
      const attemptsLeft = 3 - stored.attempts
      return res.status(400).json({
        message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
      })
    }

    // ✅ OTP correct — remove from store
    otpStore.delete(email.toLowerCase())
    res.status(200).json({ message: 'OTP verified successfully.' })

  } catch (err) {
    console.error('verifyOTP error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Step 3: Reset Password ──
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email.toLowerCase())

    if (error) throw error

    res.status(200).json({ message: 'Password reset successfully.' })

  } catch (err) {
    console.error('resetPassword error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}