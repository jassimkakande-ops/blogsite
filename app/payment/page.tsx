"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSubscriptionPlans } from '@/lib/subscriptions';
import { SubscriptionPlan } from '@/lib/supabase';
import Link from 'next/link';

// Simple client-side MNO detection for MakyPay
const detectMNO = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('256')) {
    cleaned = '256' + (cleaned.startsWith('0') ? cleaned.substring(1) : cleaned);
  }
  if (cleaned.length === 12) {
    const prefix = cleaned.substring(3, 5);
    if (['77', '78', '76', '39'].includes(prefix)) return 'MTN Mobile Money';
    if (['70', '74', '75'].includes(prefix)) return 'Airtel Money';
  }
  return 'Unknown Network';
};

function PaymentPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan'); // 'basic' or 'standard'
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [detectedMNO, setDetectedMNO] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalPhoneNumber, setModalPhoneNumber] = useState('');
  const [modalDetectedMNO, setModalDetectedMNO] = useState<string>('');

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  // Load subscription plans
  useEffect(() => {
    if (!user) return;
    const loadPlans = async () => {
      try {
        const availablePlans = await getSubscriptionPlans();

        // Filter plans based on URL parameter
        let filteredPlans = availablePlans;
        if (planParam) {
          filteredPlans = availablePlans.filter(plan =>
            plan.name?.toLowerCase().includes(planParam.toLowerCase())
          );
        }

        setPlans(filteredPlans);
        if (filteredPlans.length > 0) setSelectedPlan(filteredPlans[0]);
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    };
    loadPlans();
  }, [user, planParam]);

  // Detect mobile money provider
  useEffect(() => {
    if (phoneNumber.length >= 10) {
      setDetectedMNO(detectMNO(phoneNumber));
    } else {
      setDetectedMNO('');
    }
  }, [phoneNumber]);

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value.replace(/\D/g, ''));
  };

  const handleModalPhoneNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '');
    setModalPhoneNumber(cleanedValue);

    // Detect MNO for modal
    if (cleanedValue.length >= 10) {
      setModalDetectedMNO(detectMNO(cleanedValue));
    } else {
      setModalDetectedMNO('');
    }
  };

  const openPaymentModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setModalPhoneNumber(phoneNumber); // Pre-fill with existing number if any
    setModalDetectedMNO(detectedMNO); // Pre-fill with existing detection
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setModalPhoneNumber('');
    setModalDetectedMNO('');
  };

  const proceedWithPayment = () => {
    // Transfer modal values to main state
    setPhoneNumber(modalPhoneNumber);
    setDetectedMNO(modalDetectedMNO);
    setShowPaymentModal(false);

    // Trigger payment after a short delay to allow state updates
    setTimeout(() => {
      handlePayment();
    }, 100);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !phoneNumber || !user) return;

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const amount = selectedPlan.amount || 10000;

      // Initiate payment via MakyPay
      const response = await fetch('/api/makypay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phoneNumber,
          amount,
          description: `Subscription: ${selectedPlan.name}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Payment initiation failed');

      const result = data;
      setTransactionRef(result.uuid);

      // Show initial status message
      setPaymentStatus('processing');
      setErrorMessage('');

      // Poll payment status with a loop
      let finalResult = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 * 3s = 90 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const pollResponse = await fetch(`/api/makypay/status?transactionId=${result.uuid}`);
        const pollData = await pollResponse.json();
        
        if (!pollResponse.ok) throw new Error(pollData.error || 'Failed to check payment status');

        if (pollData.status === 'completed' || pollData.status === 'failed' || pollData.status === 'cancelled') {
          finalResult = pollData;
          break;
        }
        
        attempts++;
      }

      if (!finalResult) {
        throw new Error('Payment timed out or is taking too long. If you paid successfully, your account will be updated automatically.');
      }

      if (finalResult.status === 'completed') {
        const completeResponse = await fetch('/api/makypay/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            transactionId: finalResult.uuid,
            subscriptionPlan: selectedPlan.name.toLowerCase(),
            subscriptionDuration: selectedPlan.duration_in_days || 30,
          }),
        });

        if (!completeResponse.ok) {
          const completeData = await completeResponse.json();
          throw new Error(completeData.error || 'Failed to complete subscription processing');
        }

        // Force refresh of user's subscription status immediately after payment
        try {
          window.location.reload(); // This will trigger AuthProvider to refresh user data
        } catch (error) {
          console.error('Error refreshing subscription status:', error);
        }

        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
        setErrorMessage(`Payment ${finalResult.status}. Please try again.`);
      }
    } catch (error) {
      setPaymentStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-orange-400 hover:text-orange-300 inline-flex items-center space-x-2 mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </Link>

        <h1 className="text-3xl font-bold text-center mb-10 text-orange-400">Make Payment</h1>

        {paymentStatus === 'processing' && (
          <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-blue-400 font-medium">Processing Payment...</p>
                <p className="text-blue-300 text-sm mt-1">Please check your phone and confirm the transaction. This may take a few moments.</p>
                {transactionRef && (
                  <p className="text-blue-300 text-xs mt-2">Transaction Ref: {transactionRef.substring(0, 8)}...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-xl">
            <p className="text-green-400 font-medium">Payment Successful! Your subscription has been activated and access granted immediately.</p>
            <Link href="/" className="inline-block mt-3 px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600">
              Start Watching
            </Link>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl">
            <p className="text-red-400 font-medium">Payment Failed: {errorMessage}</p>
            <button onClick={() => setPaymentStatus('idle')} className="mt-3 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">
              Try Again
            </button>
          </div>
        )}

        {paymentStatus === 'idle' && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">
              {planParam ? `${planParam.charAt(0).toUpperCase() + planParam.slice(1)} Premium Plans` : 'Choose Your Plan'}
            </h2>
            <div className={`grid gap-6 mb-6 ${planParam ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {planParam ? (
                // Show individual plan cards when filtered
                plans.map(plan => (
                  <div key={plan.id} onClick={() => openPaymentModal(plan)}
                    className={`cursor-pointer p-6 rounded-2xl border transition-all hover:border-orange-400 hover:bg-orange-500/10 ${planParam === 'standard' ? 'border-blue-500' : 'border-gray-700'
                      } ${selectedPlan?.id === plan.id ? 'border-orange-500 bg-orange-500/10' : ''}`}>
                    {planParam === 'standard' && (
                      <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-4 inline-block">Recommended</span>
                    )}
                    <p className="font-medium text-3xl mb-2">
                      {plan.duration_in_days === 1 ? '1 Day' : `${plan.duration_in_days} Days`}
                    </p>
                    <p className="text-lg text-gray-300 mb-2">{plan.name}</p>
                    <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                    <p className="text-3xl font-bold mb-4">UGX {plan.amount?.toLocaleString()}</p>
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-orange-400 font-medium">Tap to Pay →</span>
                    </div>
                  </div>
                ))
              ) : (
                // Show grouped cards when showing all plans
                ['basic', 'standard'].map((type) => (
                  <div key={type} className={`p-6 rounded-2xl border ${type === 'standard' ? 'border-blue-500' : 'border-gray-700'} hover:border-orange-400 transition-all`}>
                    {type === 'standard' && (
                      <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-2 inline-block">Recommended</span>
                    )}
                    <h2 className="text-3xl font-bold mb-4 capitalize">{type}</h2>
                    {plans.filter(p => p.name?.toLowerCase().includes(type)).map(plan => (
                      <div key={plan.id} onClick={() => openPaymentModal(plan)}
                        className={`cursor-pointer p-4 rounded-xl border mb-3 transition-all hover:border-orange-400 hover:bg-orange-500/10 ${selectedPlan?.id === plan.id ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600'}`}>
                        <p className="font-medium text-xl mb-1">
                          {plan.duration_in_days === 1 ? '1 Day' : `${plan.duration_in_days} Days`}
                        </p>
                        <p className="text-base text-gray-300 mb-1">{plan.name}</p>
                        <p className="text-sm text-gray-400 mb-2">{plan.description}</p>
                        <p className="text-2xl font-bold mt-2">UGX {plan.amount?.toLocaleString()}</p>
                        <div className="mt-3 flex items-center justify-center">
                          <span className="text-sm text-orange-400 font-medium">Tap to Pay →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Instructions for new modal flow */}
            <div className="text-center py-8">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Choose Your Plan</h3>
                <p className="text-gray-400 text-sm">
                  Tap on any plan above to enter your mobile money number and complete payment instantly.
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-blue-400 font-medium mb-2">Payment Information</h3>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• You will receive a payment prompt on your mobile phone</li>
                    <li>• Please confirm the payment using your mobile money PIN</li>
                    <li>• Your subscription will be activated once payment is confirmed</li>
                    <li>• This process may take a few minutes to complete</li>
                    <li>• Keep your phone nearby to approve the transaction</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Complete Payment</h3>
                  <button
                    onClick={closePaymentModal}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    aria-label="Close payment modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Selected Plan Summary */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-orange-400 font-semibold mb-2">Selected Plan</h4>
                  <p className="text-white font-medium text-lg">{selectedPlan.name}</p>
                  <p className="text-gray-400 text-sm">{selectedPlan.description}</p>
                  <p className="text-gray-400 text-sm">Duration: {selectedPlan.duration_in_days} days</p>
                  <p className="text-2xl font-bold text-white mt-2">UGX {selectedPlan.amount?.toLocaleString()}</p>
                </div>

                {/* Phone Number Input */}
                <div className="mb-6">
                  <label htmlFor="modal-phone" className="block text-sm font-medium mb-2 text-white">
                    Mobile Money Number
                  </label>
                  <div className="relative">
                    <input
                      id="modal-phone"
                      type="tel"
                      value={modalPhoneNumber}
                      onChange={(e) => handleModalPhoneNumberChange(e.target.value)}
                      placeholder="Enter your phone number (e.g., 0771234567)"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
                      maxLength={15}
                    />
                    {modalDetectedMNO && (
                      <div className="absolute right-3 top-3 flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${modalDetectedMNO === 'Invalid number' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                          {modalDetectedMNO}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Enter your MTN Mobile Money or Airtel Money number
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={closePaymentModal}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedWithPayment}
                    disabled={!modalPhoneNumber || modalPhoneNumber.length < 10 || modalDetectedMNO === 'Invalid number'}
                    className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                    <span>Pay Now</span>
                  </button>
                </div>

                {/* Payment Info in Modal */}
                <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <p className="text-xs text-blue-300">
                    💡 You&apos;ll receive a payment prompt on your phone to confirm the transaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}