const supabase = require('../config/supabase')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')

// ── Login ──
exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    // Find user by email (without is_active filter)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    // Check if account is deactivated
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated.' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.status(200).json({
      token,
      user: {
        id:          user.id,
        employee_id: user.employee_id,
        name:        user.name,
        email:       user.email,
        department:  user.department,
        position:    user.position,
        role:        user.role,
      }
    })

  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Get current logged-in user ──
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, employee_id, name, email, department, position, role')
      .eq('id', req.user.id)
      .single()

    if (error || !user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.status(200).json(user)

  } catch (err) {
    console.error('GetMe error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Change Password ──
exports.changePassword = async (req, res) => {
  const { newPassword } = req.body

  try {
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id)   // ← uses logged-in user's id from JWT token

    if (error) throw error

    res.status(200).json({ message: 'Password changed successfully.' })

  } catch (err) {
    console.error('changePassword error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Update Profile ──
exports.updateProfile = async (req, res) => {
  const { name, email, department, position } = req.body

  try {
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' })
    }

    const { error } = await supabase
      .from('users')
      .update({ name, email, department, position })
      .eq('id', req.user.id)  // ← uses logged-in user's id from JWT

    if (error) throw error

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: { name, email, department, position },
    })

  } catch (err) {
    console.error('updateProfile error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

exports.heartbeat = async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', req.user.id)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('heartbeat error:', err.message)
    res.status(500).json({ message: 'Failed to update heartbeat.' })
  }
}
