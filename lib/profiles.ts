import { supabase } from './supabase';

export interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  notifications_enabled?: boolean;
  favorite_vjs?: string[];
  favorite_genres?: string[];
  favorite_actors?: string[];
  email?: string;
  subscription?: string;
  subscription_start_date?: string;
  subscription_expiry_date?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}
