"use client";

import { Button } from '@/components/ui/button';
import { Lock, User, Play, Download, Clock } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { setRedirectCookie } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { getUserSubscriptionStatus } from '@/lib/subscriptions';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'play' | 'download';
  requirePremium?: boolean;
  customMessage?: string;
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  action,
  requirePremium = true,
  customMessage
}: AuthRequiredModalProps) {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();

  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.id && requirePremium) {
      getUserSubscriptionStatus(user.id).then(setSubscriptionStatus);
    }
  }, [user?.id, requirePremium]);

  // Handle auto-close when user has required permissions
  useEffect(() => {
    if (isOpen && !loading && user && isPremium) {
      onClose();
    }
  }, [isOpen, loading, user, isPremium, onClose]);

  if (!isOpen) return null;

  const handleLogin = () => {
    // Set redirect cookie to current location
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      setRedirectCookie(currentPath);
      // Redirect to signin page with redirect parameter
      router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
    }
    onClose();
  };

  const handleUpgrade = () => {
    router.push('/payment');
    onClose();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <>
        <SignInRequiredModal
          action={action}
          onLogin={handleLogin}
          onClose={onClose}
          customMessage={customMessage}
        />

      </>
    );
  }

  // User authenticated but premium required
  if (!isPremium) {
    return (
      <PremiumRequiredModal
        action={action}
        onUpgrade={handleUpgrade}
        onClose={onClose}
        subscriptionStatus={subscriptionStatus}
        customMessage={customMessage}
      />
    );
  }

  // User is authenticated and has required permissions
  return null;
}

interface SignInRequiredModalProps {
  action: 'play' | 'download';
  onLogin: () => void;
  onClose: () => void;
  customMessage?: string;
}

function SignInRequiredModal({ action, onLogin, onClose, customMessage }: SignInRequiredModalProps) {
  const actionText = action === 'play' ? 'watch' : 'download';
  const ActionIcon = action === 'play' ? Play : Download;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <ActionIcon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Sign In Required
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {customMessage || `You need to sign in to ${actionText} this content. Create a free account or sign in to continue.`}
        </p>

        {/* Benefits */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-white font-semibold mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-orange-400" />
            Free Account Benefits:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Access to all free content</li>
            <li>• HD & 4K streaming quality of free content</li>
            <li>• Ad-free experience</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 font-medium"
          >
            Sign In / Create Account
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PremiumRequiredModalProps {
  action: 'play' | 'download';
  onUpgrade: () => void;
  onClose: () => void;
  subscriptionStatus?: any;
  customMessage?: string;
}

function PremiumRequiredModal({ action, onUpgrade, onClose, subscriptionStatus, customMessage }: PremiumRequiredModalProps) {
  const actionText = action === 'play' ? 'watch' : 'download';
  const ActionIcon = action === 'play' ? Play : Download;

  const getStatusMessage = () => {
    if (customMessage) return customMessage;

    if (!subscriptionStatus) return "This content requires a premium subscription.";

    if (subscriptionStatus.isExpired) {
      return `Your ${subscriptionStatus.subscription} subscription expired on ${new Date(subscriptionStatus.expiryDate).toLocaleDateString()}. Renew to continue watching.`;
    }

    if (!subscriptionStatus.hasSubscription) {
      return `This content requires a premium subscription to ${actionText}.`;
    }

    return `This content requires a premium subscription to ${actionText}.`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
              <ActionIcon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              {subscriptionStatus?.isExpired ? (
                <Clock className="w-3 h-3 text-black" />
              ) : (
                <span className="text-xs font-bold text-black">★</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white mb-3">
          {subscriptionStatus?.isExpired ? 'Subscription Expired' : 'Premium Content'}
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {getStatusMessage()}
        </p>

        {/* Premium Benefits */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-white font-semibold mb-2 flex items-center">
            <span className="text-yellow-400 mr-2">★</span>
            Premium Benefits:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Access to all premium content</li>
            <li>• HD & 4K streaming quality</li>
            <li>• Ad-free experience</li>
            <li>• Unlimited downloads</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white h-12 font-medium"
          >
            {subscriptionStatus?.isExpired ? 'Renew Subscription' : 'Upgrade to Premium'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy authentication checks
export function useAuthCheck() {
  const { user, loading, isPremium } = useAuth();

  const checkAuth = (requirePremium = true) => {
    if (loading) return { allowed: false, reason: 'loading' };

    if (!user) {
      return { allowed: false, reason: 'auth_required' };
    }

    if (!isPremium) {
      return { allowed: false, reason: 'premium_required' };
    }

    return { allowed: true, reason: null };
  };

  return {
    user,
    loading,
    isPremium,
    checkAuth
  };
}