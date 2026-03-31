// Supabase Configuration Template
// Copy this file to config.js and add your actual keys

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User ID function
function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user-' + crypto.randomUUID();
    localStorage.setItem('userId', userId);
  }
  return userId;
}
