"use client";

import { Suspense } from 'react';
import PlayerContent from './PlayerContent';

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}