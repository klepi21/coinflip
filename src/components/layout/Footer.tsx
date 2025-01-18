'use client'

import { useState } from 'react';
import { DisclaimerModal } from '@/components/ui/disclaimer-modal';

export const Footer = () => {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-0 right-0 text-center z-40">
        <div className="text-black font-doggie space-y-1">
          <div>
            Copyright 2025 $BOD |{' '}
            <button 
              onClick={() => setIsDisclaimerOpen(true)}
              className="hover:opacity-70 transition-opacity pointer-events-auto underline"
            >
              Disclaimer
            </button>
          </div>
          <div>made by bod (that's me) with 🖤</div>
        </div>
      </div>

      <DisclaimerModal 
        isOpen={isDisclaimerOpen} 
        onClose={() => setIsDisclaimerOpen(false)} 
      />
    </>
  );
}; 