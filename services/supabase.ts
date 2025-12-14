import { createClient } from '@supabase/supabase-js';

// Safe access to process.env for browser environments where it might not be defined
// This prevents ReferenceError: process is not defined
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
    // Check for Vite's import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Get environment variables safely
// Support both VITE_ prefix (for Vite) and REACT_APP_ prefix (for backward compatibility)
const envUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Check if Supabase is actually configured with valid values
export const isSupabaseConfigured = () => {
  // Check if url exists, isn't the default placeholder from .env.example, and isn't our internal fallback
  return !!envUrl && !!envKey && envUrl !== 'YOUR_SUPABASE_URL' && !envUrl.includes('placeholder');
};

// To prevent "supabaseUrl is required" error during initialization when env vars are missing,
// we provide fallback values. The app logic in dataService.ts checks `isSupabaseConfigured()`
// before attempting to make actual network requests.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);