/* supabase.js — Farmers Factory
 * Requires: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * loaded BEFORE this file.
 *
 * ⚠ PASTE YOUR FULL SUPABASE ANON KEY BELOW (from Supabase → Settings → API)
 */
var SUPABASE_URL = 'https://slfxozmbwogpisxeltty.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZnhvem1id29ncGlzeGVsdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjkwMjMsImV4cCI6MjA4MjE0NTAyM30.GYBRJ64ImMLIlV9Er6jU-VmMBdNrgA-VU0H3yYIy8Tg';

window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
