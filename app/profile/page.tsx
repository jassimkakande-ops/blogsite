"use client";

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, Profile } from '@/lib/profiles';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const prof = await getProfile(user.id);
        setProfile(prof);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="p-8 bg-gray-900 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <Link href="/signin" className="px-4 py-2 bg-orange-500 rounded-lg text-white font-semibold hover:bg-orange-600 transition">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-bold text-orange-400 mb-10 text-center">Your Profile</h1>
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !profile ? (
          <div className="p-4 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-300 text-center">
            No profile found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: User Details */}
            <div className="flex flex-col items-center w-full bg-black/40 rounded-2xl p-10 border border-gray-800">
              <div className="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="text-xl font-semibold mb-1">{profile.name || profile.email}</div>
              <div className="text-sm text-gray-400 mb-1">Email: {profile.email}</div>
              <div className="text-sm text-gray-400 mb-1">Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}</div>
              {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                <div className="text-sm text-gray-400 mb-1">Favorite Genres: {profile.favorite_genres.join(', ')}</div>
              )}
              {profile.favorite_vjs && profile.favorite_vjs.length > 0 && (
                <div className="text-sm text-gray-400 mb-1">Favorite VJs: {profile.favorite_vjs.join(', ')}</div>
              )}
              {profile.favorite_actors && profile.favorite_actors.length > 0 && (
                <div className="text-sm text-gray-400 mb-1">Favorite Actors: {profile.favorite_actors.join(', ')}</div>
              )}
            </div>
            {/* Right: Subscription Status */}
            <div className="flex flex-col items-center bg-black/40 rounded-2xl p-6 border border-gray-800">
              <div className="text-xl font-semibold mb-3">Subscription</div>
              {profile.subscription ? (
                <div className="text-green-400 text-lg font-bold mb-2">{profile.subscription}</div>
              ) : (
                <div className="text-yellow-300 mb-2">No active subscription.</div>
              )}
              {profile.subscription_start_date && (
                <div className="text-sm text-gray-400 mb-1">Start: {new Date(profile.subscription_start_date).toLocaleDateString()}</div>
              )}
              {profile.subscription_expiry_date && (
                <div className="text-sm text-gray-400 mb-1">Expires: {new Date(profile.subscription_expiry_date).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-center mt-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
