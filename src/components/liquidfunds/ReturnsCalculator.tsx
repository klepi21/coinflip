'use client';

import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ReturnsCalculatorProps {
  sharePrice: string;
  apy: number;
}

export const ReturnsCalculator = ({ sharePrice, apy }: ReturnsCalculatorProps) => {
  const [investment, setInvestment] = useState<string>('1000');
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');

  const calculateReturns = () => {
    const principal = Number(investment);
    const years = timeframe === '1Y' ? 1 : 
                 timeframe === '6M' ? 0.5 : 
                 timeframe === '3M' ? 0.25 : 
                 0.0833; // 1 month

    const estimatedReturn = principal * Math.pow(1 + (apy / 100), years);
    const profit = estimatedReturn - principal;
    
    return {
      estimatedValue: estimatedReturn.toFixed(2),
      profit: profit.toFixed(2),
      shares: (principal / Number(sharePrice)).toFixed(2)
    };
  };

  const results = calculateReturns();

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-medium text-white">Returns Calculator</h2>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="rounded-full p-1 hover:bg-white/5 transition-colors">
                <Info className="w-4 h-4 text-white/40" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-black/90 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/80
                         shadow-xl backdrop-blur-xl max-w-xs"
              >
                Estimate your potential returns based on current APY. 
                Note: APY is variable and past performance doesn't guarantee future returns.
                <Tooltip.Arrow className="fill-white/10" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      <div className="space-y-6">
        {/* Investment Input */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Investment Amount (USDC)</label>
          <input
            type="number"
            value={investment}
            onChange={(e) => setInvestment(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3
                     text-white placeholder-white/20 focus:outline-none focus:border-primary/50"
            placeholder="Enter amount..."
          />
        </div>

        {/* Timeframe Selection */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Timeframe</label>
          <div className="grid grid-cols-4 gap-2">
            {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`py-2 rounded-lg font-medium text-sm transition-all
                          ${timeframe === period 
                            ? 'bg-primary text-white' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-black/20 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Estimated Value</span>
            <span className="text-lg font-bold text-white">
              ${results.estimatedValue}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Potential Profit</span>
            <span className="text-lg font-bold text-emerald-400">
              +${results.profit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Fund Shares</span>
            <span className="text-lg font-bold text-white">
              {results.shares}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 