'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecentTransactions } from './RecentTransactions';
import { TopHolders } from './TopHolders';
import { TokenDetails } from './TokenDetails';
import { FeeStructure } from './FeeStructure';

interface AnalyticsCarouselProps {
  fundAddress: string;
  fundTokenId: string;
  tokenDetails: any;
  feeDetails: any;
}

export const AnalyticsCarousel = ({ 
  fundAddress, 
  fundTokenId, 
  tokenDetails,
  feeDetails 
}: AnalyticsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const components = [
    {
      id: 'recent-transactions',
      component: <RecentTransactions fundAddress={fundAddress} />
    },
    {
      id: 'top-holders',
      component: <TopHolders fundAddress={fundAddress} fundTokenId={fundTokenId} />
    },
    {
      id: 'token-details',
      component: <TokenDetails details={tokenDetails} />
    },
    {
      id: 'fee-structure',
      component: <FeeStructure fees={feeDetails} />
    }
  ];

  const visibleComponents = components.slice(currentIndex, currentIndex + 2);
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < components.length - 2;

  const scroll = (direction: 'left' | 'right') => {
    setCurrentIndex(prev => {
      if (direction === 'left' && canScrollLeft) return prev - 2;
      if (direction === 'right' && canScrollRight) return prev + 2;
      return prev;
    });
  };

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`p-2 rounded-full bg-white/5 border border-white/10 
                     transition-all duration-300 ${
                       canScrollLeft 
                         ? 'hover:bg-white/10 hover:border-white/20' 
                         : 'opacity-50 cursor-not-allowed'
                     }`}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`p-2 rounded-full bg-white/5 border border-white/10 
                     transition-all duration-300 ${
                       canScrollRight 
                         ? 'hover:bg-white/10 hover:border-white/20' 
                         : 'opacity-50 cursor-not-allowed'
                     }`}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Components Container */}
      <div className="relative overflow-hidden">
        <motion.div
          className="grid grid-cols-2 gap-8"
          animate={{ x: `${-currentIndex * 50}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {visibleComponents.map(({ id, component }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {component}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: components.length / 2 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i * 2)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex / 2 
                ? 'bg-primary w-6' 
                : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}; 