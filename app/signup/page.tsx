'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRedirectCookie, setRedirectCookie } from '@/lib/utils';

function SignUpContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, signInWithGoogle } = useAuth()

  useEffect(() => {
    // Set redirect cookie if redirect parameter exists and no cookie is already set
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && !getRedirectCookie()) {
      setRedirectCookie(redirectParam)
    }
  }, [searchParams])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')

    // Ensure redirect cookie is set for OAuth flow
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && !getRedirectCookie()) {
      setRedirectCookie(redirectParam)
    }

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error.message || 'Failed to sign up with Google')
      setLoading(false)
    }
    // If successful, the redirect will be handled by the OAuth flow
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)

    if (!error) {
      router.push('/signin?message=check_email')
    } else {
      setError(error.message || 'Failed to sign up')
    }

    setLoading(false)
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md bg-[#23272f] rounded-2xl shadow-xl px-6 py-6 flex flex-col items-center border border-gray-800">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/logo.png"
              alt="Kilax Movies Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain rounded"
              style={{ margin: '0 auto' }}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white text-center mb-2">Sign Up</h2>

          {error && (
            <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white text-black text-base font-medium hover:bg-orange-100 transition mb-2 border border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.46 2.14 30.12 0 24 0 14.88 0 6.74 5.06 2.69 12.44l7.97 6.19C12.13 13.43 17.62 9.5 24 9.5z" /><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.44-4.74H24v9.04h12.44c-.54 2.92-2.17 5.39-4.63 7.07l7.19 5.6C43.97 37.14 46.1 31.33 46.1 24.55z" /><path fill="#FBBC05" d="M10.66 28.63A14.48 14.48 0 0 1 9.5 24c0-1.62.28-3.19.77-4.63l-7.97-6.19A23.91 23.91 0 0 0 0 24c0 3.85.92 7.48 2.54 10.69l8.12-6.06z" /><path fill="#EA4335" d="M24 48c6.12 0 11.26-2.03 15.01-5.53l-7.19-5.6c-2.01 1.35-4.59 2.16-7.82 2.16-6.38 0-11.87-3.93-13.34-9.44l-8.12 6.06C6.74 42.94 14.88 48 24 48z" /></g></svg>
            {loading ? 'Signing up...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <form onSubmit={handleEmailSignUp} className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded bg-[#22283a] border border-gray-700 px-4 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded bg-[#22283a] border border-gray-700 px-4 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded bg-[#22283a] border border-gray-700 px-4 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base py-3 rounded-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </div>
        <div className="w-full flex flex-col items-center mt-5">
          <span className="text-gray-400 text-sm">Already have an account? <Link href="/signin" className="text-orange-400 hover:underline">Sign in</Link></span>
        </div>
      </div>
    </div>
  );
}

function SignUpFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md bg-[#23272f] rounded-2xl shadow-xl px-6 py-6 flex flex-col items-center border border-gray-800">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/logo.png"
              alt="Kilax Movies Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain rounded"
              style={{ margin: '0 auto' }}
            />
          </div>
          <p className="text-gray-400 text-sm">Watch your favorites</p>
        </div>
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpContent />
    </Suspense>
  );
}
