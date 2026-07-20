// Copy this file to `config.js` and fill in your values, then deploy:
//     cp config.example.js config.js
// `config.js` is git-ignored so your keys never get committed. Both values are
// the PUBLIC Supabase URL + anon key (safe to ship to the browser) — order data
// is protected by Row Level Security + staff auth, NOT by hiding the key.
// Never put the service_role key here; that stays a server-side secret.
//
// With no config.js present (or an empty SUPABASE_URL) the Hub runs in DEMO
// mode against local fixtures.
window.HUB_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co', // Settings → API → Project URL
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',            // Settings → API → anon public key
};
