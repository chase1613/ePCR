const supabase = require("../config/supabase");

// ── GET /api/pillars ──────────────────────────────────────────────────────────
// Returns all pillars ordered by division → type → created_at
// Optional ?division=Legal to filter by a specific division
const getPillars = async (req, res) => {
  try {
    const { division } = req.query;

    let query = supabase
      .from("pillars")
      .select("*")
      .order("division",   { ascending: true })
      .order("type",       { ascending: true })
      .order("created_at", { ascending: true });

    if (division) {
      query = query.ilike("division", division);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("getPillars error:", err.message);
    res.status(500).json({ message: "Failed to fetch pillars." });
  }
};

// ── GET /api/pillars/divisions ────────────────────────────────────────────────
// Returns distinct division names (for the dropdown in the modal)
const getDivisions = async (req, res) => {
  try {
    // Get divisions from pillars table
    const { data: pillarDivs, error: e1 } = await supabase
      .from('pillars')
      .select('division')
      .order('division', { ascending: true })

    if (e1) throw e1

    // Get divisions from divisions table
    const { data: divTable, error: e2 } = await supabase
      .from('divisions')
      .select('name')
      .order('name', { ascending: true })

    if (e2) throw e2

    // Merge and deduplicate
    const fromPillars = pillarDivs.map((r) => r.division)
    const fromTable   = divTable.map((r) => r.name)
    const divisions   = [...new Set([...fromPillars, ...fromTable])].sort()

    res.json(divisions)
  } catch (err) {
    console.error('getDivisions error:', err.message)
    res.status(500).json({ message: 'Failed to fetch divisions.' })
  }
}

// ── POST /api/pillars ─────────────────────────────────────────────────────────
const createPillar = async (req, res) => {
  try {
    const { name, type, description, division, weight } = req.body;

    if (!name?.trim())     return res.status(400).json({ message: "Pillar name is required." });
    if (!type?.trim())     return res.status(400).json({ message: "Function type is required." });
    if (!division?.trim()) return res.status(400).json({ message: "Division is required." });

    const { data, error } = await supabase
      .from("pillars")
      .insert([{
        name:        name.trim(),
        type,
        description: description?.trim() || "",
        division:    division.trim(),
        weight:      weight || 0,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("createPillar error:", err.message);
    res.status(500).json({ message: "Failed to create pillar." });
  }
};

// ── PUT /api/pillars/:id ──────────────────────────────────────────────────────
const updatePillar = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, division, weight } = req.body;

    if (!name?.trim())     return res.status(400).json({ message: "Pillar name is required." });
    if (!type?.trim())     return res.status(400).json({ message: "Function type is required." });
    if (!division?.trim()) return res.status(400).json({ message: "Division is required." });

    const { data, error } = await supabase
      .from("pillars")
      .update({
        name:        name.trim(),
        type,
        description: description?.trim() || "",
        division:    division.trim(),
        weight:      weight || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Pillar not found." });

    res.json(data);
  } catch (err) {
    console.error("updatePillar error:", err.message);
    res.status(500).json({ message: "Failed to update pillar." });
  }
};

// ── PATCH /api/pillars/division-rename ───────────────────────────────────────
// Bulk-updates the division field on all pillars matching oldDivision
const renameDivision = async (req, res) => {
  try {
    const { oldDivision, newDivision } = req.body;

    if (!oldDivision?.trim()) return res.status(400).json({ message: "Old division name is required." });
    if (!newDivision?.trim()) return res.status(400).json({ message: "New division name is required." });
    if (oldDivision.trim() === newDivision.trim())
      return res.status(400).json({ message: "New name is the same as the current name." });

    const { data, error } = await supabase
      .from("pillars")
      .update({ division: newDivision.trim() })
      .eq("division", oldDivision.trim())
      .select();

    if (error) throw error;

    res.json({ message: `Division renamed. ${data.length} pillar(s) updated.`, updated: data.length });
  } catch (err) {
    console.error("renameDivision error:", err.message);
    res.status(500).json({ message: "Failed to rename division." });
  }
};

// ── DELETE /api/pillars/:id ───────────────────────────────────────────────────
const deletePillar = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("pillars")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Pillar deleted." });
  } catch (err) {
    console.error("deletePillar error:", err.message);
    res.status(500).json({ message: "Failed to delete pillar." });
  }
};

// ── POST /api/pillars/divisions ───────────────────────────────────────────────
const createDivision = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Division name is required.' })

    const { data, error } = await supabase
      .from('divisions')
      .insert([{ name: name.trim() }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: 'Division already exists.' })
      throw error
    }

    res.status(201).json(data)
  } catch (err) {
    console.error('createDivision error:', err.message)
    res.status(500).json({ message: 'Failed to create division.' })
  }
}

module.exports = { getPillars, getDivisions, renameDivision, createPillar, updatePillar, deletePillar, createDivision };