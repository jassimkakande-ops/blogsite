"use client";

import { useAuth } from './AuthProvider';
import { setRedirectCookie } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthModal } from './AuthModal';
import AuthRequiredModal, { useAuthCheck } from './AuthRequiredModal';
import { Lock, User, Play, Download, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserSubscriptionStatus } from '@/lib/subscriptions';

interface AuthGuardProps {
  children?: React.ReactNode;
  action: 'play' | 'download';
  onAuthRequired?: () => void;
  requirePremium?: boolean;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ 
  children, 
  action, 
  onAuthRequired, 
  requirePremium = false,
  fallback 
}: AuthGuardProps) {
  const { user, loading, isPremium } = useAuth();
  const { checkAuth } = useAuthCheck();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthRequired = () => {
    if (onAuthRequired) {
      onAuthRequired();
    } else {
      // Set redirect cookie to current location before showing modal or redirecting
      if (typeof window !== 'undefined') {
        setRedirectCookie(window.location.pathname + window.location.search);
      }
      setShowAuthModal(true);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const authCheck = checkAuth(requirePremium);

  // Show unified auth modal if needed
  if (!authCheck.allowed) {
    if (fallback) {
      return (
        <>
          {fallback}
          <AuthRequiredModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            action={action}
            requirePremium={requirePremium}
          />
        </>
      );
    }

    return (
      <AuthRequiredModal
        isOpen={true}
        onClose={() => {}}
        action={action}
        requirePremium={requirePremium}
      />
    );
  }

  // User is authenticated (and premium if required)
  return <>{children}</>;
}



// Hook for easy authentication checks (deprecated - use useAuthCheck from AuthRequiredModal instead)
export function useAuthGuard() {
  const { checkAuth } = useAuthCheck();
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();

  const requireAuth = (action: 'play' | 'download', requirePremium = false) => {
    return checkAuth(requirePremium);
  };

  const redirectToAuth = (currentPath?: string) => {
    const path = currentPath || window.location.pathname + window.location.search;
    router.push(`/signin?redirect=${encodeURIComponent(path)}`);
  };

  return {
    user,
    loading,
    isPremium,
    requireAuth,
    redirectToAuth
  };
}
