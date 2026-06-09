// Utility: Check if subscription is standard premium
import type { Subscription } from './supabase';

export function isStandardPremium(subscription: Subscription | null) {
  if (!subscription) {
    console.log('isStandardPremium: No subscription found');
    return false;
  }
  
  // Normalize to lowercase, remove spaces and underscores
  const plan = subscription.plan?.toLowerCase().replace(/[_ ]/g, '');
  const isStandard = plan === 'standard' || plan === 'standardpremium';
  
  console.log('isStandardPremium check:', {
    originalPlan: subscription.plan,
    normalizedPlan: plan,
    isStandard
  });
  
  return isStandard;
}

