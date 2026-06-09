'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserSubscription } from '@/lib/subscriptions'

interface AuthContextType {
  user: User | null
  loading: boolean
  isPremium: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  // Check premium status when user changes
  const checkPremiumStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsPremium(false)
      return
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
      )
      
      // Get user profile with subscription details including expiry date
      const profilePromise = supabase
        .from('profiles')
        .select('subscription, subscription_expiry_date')
        .eq('id', currentUser.id)
        .maybeSingle()
      
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any
      
      if (error || !profile) {
        console.log('No profile found or error:', error)
        setIsPremium(false)
        return
      }

      // Check if subscription exists and is not expired
      const hasSubscription = profile.subscription && profile.subscription !== 'free'
      const isNotExpired = profile.subscription_expiry_date && 
                          new Date(profile.subscription_expiry_date) > new Date()
      
      const isPremiumUser = hasSubscription && isNotExpired
      
      console.log('Premium status check:', {
        hasSubscription,
        subscription: profile.subscription,
        expiryDate: profile.subscription_expiry_date,
        isNotExpired,
        isPremiumUser
      })
      
      setIsPremium(isPremiumUser)
    } catch (error) {
      console.error('Error checking premium status:', error)
      // Don't let subscription errors block the auth flow
      setIsPremium(false)
    }
  }

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state')
    
    // Add a fallback timeout to ensure loading never gets stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout reached, forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider: Got session', session?.user?.email || 'no user')
      setUser(session?.user ?? null)
      
      // Check premium status but don't block loading state
      if (session?.user) {
        console.log('AuthProvider: Checking premium status for user')
        checkPremiumStatus(session.user).catch(console.error)
      }
      
      console.log('AuthProvider: Setting loading to false')
      setLoading(false)
      clearTimeout(loadingTimeout)
    }).catch((error) => {
      console.error('AuthProvider: Error getting session:', error)
      setLoading(false)
      clearTimeout(loadingTimeout)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', event, session?.user?.email || 'no user')
        setUser(session?.user ?? null)

        // Only check premium status if we have a user and it's not a sign out event
        if (session?.user && event !== 'SIGNED_OUT') {
          // Don't await this to prevent blocking the auth state change
          checkPremiumStatus(session.user).catch(console.error)
        } else {
          setIsPremium(false)
        }

        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    // Use the canonical redirect URL - must match Supabase OAuth settings exactly
    let redirectUrl = `${window.location.origin}/auth/callback`
    
    // For production environments with custom domains, ensure the URL is correct
    // Remove trailing slashes and normalize
    redirectUrl = redirectUrl.replace(/\/$/, '')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error') }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    })
    return { error }
  }

  const value = {
    user,
    loading,
    isPremium,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}