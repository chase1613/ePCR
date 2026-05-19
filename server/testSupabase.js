require('dotenv').config();
const supabase = require('./config/supabase');

async function testConnection() {
  console.log('Testing Supabase connection...');

  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connected to Supabase successfully!');
  }
}

testConnection();