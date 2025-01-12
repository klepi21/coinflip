'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGetLiquidFunds } from '@/hooks/useGetLiquidFunds';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const LiquidFundsTable = () => {
  const router = useRouter();
  const { funds, isLoading, error } = useGetLiquidFunds();

  // Helper function to safely format numbers
  const formatNumber = (value: string, decimals: number, suffix: string = '') => {
    try {
      if (!value || value === '0') return `0.00${suffix}`;
      return `${(Number(value) / Math.pow(10, decimals)).toFixed(decimals === 6 ? 6 : 2)}${suffix}`;
    } catch (err) {
      console.error('Error formatting number:', err);
      return `0.00${suffix}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 dark:text-red-400">Failed to load funds</p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10">
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-4 text-white/60 font-medium">Name</th>
                <th className="text-right py-4 px-4 text-white/60 font-medium">Price</th>
                <th className="text-right py-4 px-4 text-white/60 font-medium">AUM</th>
                <th className="text-right py-4 px-4 text-white/60 font-medium">Supply</th>
                <th className="text-right py-4 px-4 text-white/60 font-medium">Status</th>
                <th className="text-right py-4 px-4 text-white/60 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {funds.map((fund) => (
                <motion.tr 
                  key={fund.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  className="transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-white">{fund.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    ${formatNumber(fund.price, 6)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    ${formatNumber(fund.nav, 6, 'M')}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    {formatNumber(fund.supply, 18)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${fund.isPaused 
                        ? 'bg-red-500/10 text-red-500' 
                        : 'bg-green-500/10 text-green-500'}`}
                    >
                      {fund.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link 
                      href={`/liquid-funds/${fund.address}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 