const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = 'https://hqgyzgampicteuufwgve.supabase.co';

// Use service role key for server-side operations (bypasses RLS)
// If not set, fall back to anon key (but RLS must be disabled)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabaseAnonKey = 'sb_publishable_7LgZ0Ac4lWGxBvFL4SZnuw_tXfka0P8';

// Use service role key if available, otherwise use anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

// Log which key is being used (for debugging)
if (supabaseServiceKey) {
  console.log('✅ Using SUPABASE_SERVICE_ROLE_KEY (RLS bypassed)');
} else {
  console.log('⚠️  Using anon key - RLS must be disabled');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;

