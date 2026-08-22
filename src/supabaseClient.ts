import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey !== '';

// Initialize client only if configurations are complete to avoid runtime initialization errors
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
