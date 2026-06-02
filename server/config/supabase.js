const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,      // ← no session stored in memory per instance
      autoRefreshToken: false,    // ← no background refresh timers
      detectSessionInUrl: false,  // ← irrelevant server-side, skip the overhead
    },
    db: {
      schema: 'public',
    },
    realtime: {
      transport: ws,              // ← kept from your original
    },
  }
)

module.exports = supabase;