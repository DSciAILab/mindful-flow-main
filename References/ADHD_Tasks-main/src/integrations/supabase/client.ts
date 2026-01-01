import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is not set in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define o APP_ID para ser usado nas políticas RLS
export const APP_ID = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6';