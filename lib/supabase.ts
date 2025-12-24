import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { webSafeStorage } from './storage_adapter';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ykzpoekufhcvzqltimys.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrenBvZWt1ZmhjdnpxbHRpbXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTYxNzgsImV4cCI6MjA4MjA3MjE3OH0.M6-8-AYzSJRJVnB2QGnUxOPJM15gwLvBUDfxnLhiwgk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webSafeStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  is_completed: boolean;
  is_daily: boolean;
  last_completed_date: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsHistory {
  id: string;
  user_id: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  category_stats: any;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  deleted_at: string | null;
  is_deleted_for_everyone: boolean;
}

export interface MessageDeletion {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
}
