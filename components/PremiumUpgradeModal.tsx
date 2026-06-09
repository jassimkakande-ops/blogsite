"use client";

import { Button } from '@/components/ui/button';
import { Download, X, Star, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumUpgradeModal({ isOpen, onClose }: PremiumUpgradeModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard'>('standard');

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push(`/payment?plan=${selectedPlan}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full text-center border border-gray-700 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="px-8 pt-12 pb-6">
          <h1 className="text-orange-400 text-lg font-semibold mb-2">Premium Plans</h1>
          <h2 className="text-white text-2xl font-bold mb-2">Choose Your Premium Plan</h2>
          <p className="text-gray-400 text-sm">Select the plan that works best for you</p>
        </div>

        {/* Plans */}
        <div className="px-6 pb-6 space-y-4">
          {/* Basic Premium */}
          <div 
            className={`rounded-lg p-4 border cursor-pointer transition-all ${
              selectedPlan === 'basic' 
                ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedPlan('basic')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                  selectedPlan === 'basic' ? 'bg-orange-500' : 'bg-gray-700'
                }`}>
                  <Star className={`w-5 h-5 ${selectedPlan === 'basic' ? 'text-white' : 'text-orange-400'}`} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${selectedPlan === 'basic' ? 'text-orange-400' : 'text-white'}`}>
                    Basic Premium
                  </h3>
                  <p className={`text-sm ${selectedPlan === 'basic' ? 'text-gray-300' : 'text-gray-400'}`}>
                    Ad-free viewing, HD quality
                  </p>
                </div>
              </div>
              <div className={selectedPlan === 'basic' ? 'text-orange-400' : 'text-gray-400'}>
                {selectedPlan === 'basic' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Standard Premium */}
          <div 
            className={`rounded-lg p-4 border cursor-pointer transition-all ${
              selectedPlan === 'standard' 
                ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedPlan('standard')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                  selectedPlan === 'standard' ? 'bg-orange-500' : 'bg-gray-700'
                }`}>
                  <Star className={`w-5 h-5 ${selectedPlan === 'standard' ? 'text-white' : 'text-orange-400'}`} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${selectedPlan === 'standard' ? 'text-orange-400' : 'text-white'}`}>
                    Standard Premium
                  </h3>
                  <p className={`text-sm ${selectedPlan === 'standard' ? 'text-gray-300' : 'text-gray-400'}`}>
                    Download content, multiple devices
                  </p>
                  {selectedPlan === 'standard' && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded mt-1 inline-block">
                      RECOMMENDED
                    </span>
                  )}
                </div>
              </div>
              <div className={selectedPlan === 'standard' ? 'text-orange-400' : 'text-gray-400'}>
                {selectedPlan === 'standard' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="px-6 pb-8">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold rounded-lg"
          >
            Upgrade to {selectedPlan === 'basic' ? 'Basic' : 'Standard'}
          </Button>
        </div>
      </div>
    </div>
  );
}