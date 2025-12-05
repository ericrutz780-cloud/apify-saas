import { createClient } from '@supabase/supabase-js';

// Stelle sicher, dass diese Variablen in deiner .env Datei im Frontend-Ordner stehen!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
