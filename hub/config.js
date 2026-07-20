// Ops Hub runtime config. Fill these in to point the Hub at your Supabase
// project. Both values are the PUBLIC (safe-to-ship) Supabase URL + anon key —
// order data is protected by Row Level Security + staff auth, NOT by hiding the
// key. Leave SUPABASE_URL empty to run in DEMO mode (local fixture data, no
// login) for previewing the UI.
window.HUB_CONFIG = {
  SUPABASE_URL: '', // e.g. 'https://xxxx.supabase.co'
  SUPABASE_ANON_KEY: '', // the project's anon/public key
};
