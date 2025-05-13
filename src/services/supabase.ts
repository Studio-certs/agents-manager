import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error checking for Supabase credentials
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL. Please connect to Supabase using the "Connect to Supabase" button.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid VITE_SUPABASE_URL format. Please reconnect to Supabase using the "Connect to Supabase" button.');
}

// Retry mechanism with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If this is not a connection error, don't retry
      if (!(error instanceof Error) || 
          !error.message.includes('connect error') &&
          !error.message.includes('503')) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after maximum retries');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Wrap auth operations with retry mechanism
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await retryWithBackoff(() => 
      supabase.auth.getSession()
    );
    if (error) throw error;
    return session?.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserRole() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await retryWithBackoff(() =>
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    );
    
    if (error) throw error;
    return data?.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === 'admin';
}