"use client";

import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { getUserSubscriptionStatus } from '@/lib/subscriptions';
import { Clock, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SubscriptionStatusBadgeProps {
  showDetails?: boolean;
  className?: string;
}

export function SubscriptionStatusBadge({ 
  showDetails = false, 
  className = "" 
}: SubscriptionStatusBadgeProps) {
  const { user, isPremium } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      getUserSubscriptionStatus(user.id)
        .then(setSubscriptionStatus)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading || !user) return null;

  const getStatusColor = () => {
    if (!subscriptionStatus?.hasSubscription) return 'bg-gray-600';
    if (subscriptionStatus.isExpired) return 'bg-red-600';
    if (subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining <= 7) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStatusIcon = () => {
    if (!subscriptionStatus?.hasSubscription) return null;
    if (subscriptionStatus.isExpired) return <AlertTriangle className="w-3 h-3" />;
    if (subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining <= 7) return <Clock className="w-3 h-3" />;
    return <Crown className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (!subscriptionStatus?.hasSubscription) return 'Free';
    if (subscriptionStatus.isExpired) return 'Expired';
    if (subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining <= 7) {
      return `${subscriptionStatus.daysRemaining}d left`;
    }
    return subscriptionStatus.subscription || 'Premium';
  };

  const getDetailedMessage = () => {
    if (!subscriptionStatus?.hasSubscription) {
      return 'Upgrade to premium to access exclusive content';
    }
    if (subscriptionStatus.isExpired) {
      return `Your subscription expired on ${new Date(subscriptionStatus.expiryDate).toLocaleDateString()}`;
    }
    if (subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining <= 7) {
      return `Your subscription expires in ${subscriptionStatus.daysRemaining} day${subscriptionStatus.daysRemaining > 1 ? 's' : ''}`;
    }
    if (subscriptionStatus.expiryDate) {
      return `Active until ${new Date(subscriptionStatus.expiryDate).toLocaleDateString()}`;
    }
    return 'Premium subscription active';
  };

  const handleUpgrade = () => {
    router.push('/payment');
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="font-semibold text-white">{getStatusText()}</span>
        </div>
        {getStatusIcon() && (
          <div className="text-gray-400">
            {getStatusIcon()}
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-3">
        {getDetailedMessage()}
      </p>

      {(!subscriptionStatus?.hasSubscription || subscriptionStatus.isExpired || 
        (subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining <= 7)) && (
        <Button 
          onClick={handleUpgrade}
          size="sm"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          {subscriptionStatus?.isExpired ? 'Renew Subscription' : 'Upgrade Now'}
        </Button>
      )}
    </div>
  );
}

// Hook for easy subscription status access
export function useSubscriptionStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getUserSubscriptionStatus(user.id)
        .then(setStatus)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  return { status, loading };
}