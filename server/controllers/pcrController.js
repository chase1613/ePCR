const supabase = require('../config/supabase')

// ── Get all PCRs for logged-in user ──
exports.getUserPCRs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pcr')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.status(200).json(data)
  } catch (err) {
    console.error('getUserPCRs error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

// ── Create PCR ──
exports.createPCR = async (req, res) => {
  const { period, core, strategic, support, position, division } = req.body
  const employeeName = req.body.name   // ← access name directly

  try {
    if (!period) {
      return res.status(400).json({ message: 'Period is required.' })
    }

    const { error } = await supabase
      .from('pcr')
      .insert({
        user_id:   req.user.id,
        period,
        name:      employeeName,   // ← now defined
        position,                  // ← now included
        division,                  // ← now included
        core:      core      || [],
        strategic: strategic || [],
        support:   support   || [],
      })

    if (error) throw error
    res.status(201).json({ message: 'PCR created successfully.' })
  } catch (err) {
    console.error('createPCR error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}

exports.deletePCR = async (req, res) => {
  const { id } = req.params
  try {
    const { error } = await supabase
      .from('pcr')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)   // ← safety: only delete own PCRs

    if (error) throw error
    res.status(200).json({ message: 'PCR deleted successfully.' })
  } catch (err) {
    console.error('deletePCR error:', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
}