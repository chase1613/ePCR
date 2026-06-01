const supabase = require('../config/supabase')
const bcrypt   = require('bcryptjs')

// ── Get all users ──
exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, employee_id, name, email, department, position, role, is_active, created_at, last_seen')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.status(200).json(data)

  } catch (err) {
    console.error('getUsers error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Create new user ──
exports.createUser = async (req, res) => {
  const { employee_id, name, department, position, role, password } = req.body
  const email = req.body.email?.toLowerCase().trim()

  try {
    if (!employee_id || !name || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be filled.' })
    }

    // Check if email or employee_id already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},employee_id.eq.${employee_id}`)

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'Email or Employee ID already exists.' })
    }

    const hashedPass = await bcrypt.hash(password, 10)

    const { error } = await supabase
      .from('users')
      .insert({
        employee_id,
        name,
        email,  
        password:   hashedPass,
        department: department || null,
        position:   position   || null,
        role:       role       || 'user',
      })

    if (error) throw error
    res.status(201).json({ message: 'User created successfully.' })

  } catch (err) {
    console.error('createUser error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Update user ──
exports.updateUser = async (req, res) => {
  const { id } = req.params
  const { name, email, department, position, role } = req.body

  try {
    // Check user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Check if another user already owns this email
    const { data: emailTaken } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()

    if (emailTaken) {
      return res.status(409).json({ message: 'Email is already in use.' })
    }

    const { error } = await supabase
      .from('users')
      .update({ name, email, department, position, role })
      .eq('id', id)

    if (error) throw error
    res.status(200).json({ message: 'User updated successfully.' })

  } catch (err) {
    console.error('updateUser error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Toggle active/inactive ──
exports.toggleUser = async (req, res) => {
  const { id } = req.params

  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const newStatus = !user.is_active

    const { error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)

    if (error) throw error

    res.status(200).json({
      message:   `User ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      is_active: newStatus,
    })

  } catch (err) {
    console.error('toggleUser error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}