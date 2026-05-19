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

    // Check if there's an existing OTP that hasn't expired yet
    const existing = otpStore.get(email.toLowerCase())
    if (existing && Date.now() < existing.expires) {
      const minutesLeft = Math.ceil((existing.expires - Date.now()) / 60000)
      return res.status(429).json({
        message: `An OTP was already sent. Please wait ${minutesLeft} minute(s) before requesting a new one.`,
      })
    }

    // Generate OTP — expires in 15 minutes
    const otp     = generateOTP()
    const expires = Date.now() + 15 * 60 * 1000
    otpStore.set(email.toLowerCase(), { otp, expires, attempts: 0 })

    // Send email
    await resend.emails.send({
      from:    'ePCR CSC <onboarding@resend.dev>',
      to:      email,
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

    // Track failed attempts — block after 5 wrong tries
    if (stored.attempts >= 5) {
      otpStore.delete(email.toLowerCase())
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      })
    }

    if (stored.otp !== token) {
      // Increment attempts
      stored.attempts += 1
      otpStore.set(email.toLowerCase(), stored)
      const attemptsLeft = 5 - stored.attempts
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