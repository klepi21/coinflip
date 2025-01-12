'use client'

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import { useGetLiquidFunds } from '@/hooks/useGetLiquidFunds';
import Image from 'next/image';

export const LiquidFundsTable = () => {
  const router = useRouter();
  const { funds, isLoading, error } = useGetLiquidFunds();

  // Helper function to safely format numbers
  const formatNumber = (value: string, decimals: number) => {
    try {
      if (!value || value === '0') return '0.00';
      return (Number(value) / Math.pow(10, decimals)).toFixed(decimals === 6 ? 4 : 2);
    } catch (err) {
      console.error('Error formatting number:', err);
      return '0.00';
    }
  };

  const getTokenIconUrl = (identifier: string) => {
    return `https://tools.multiversx.com/assets-cdn/devnet/tokens/${identifier}/icon.png`;
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
        <p className="text-red-500">Failed to load funds</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {funds?.map((fund, index) => (
        <motion.div
          key={fund.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => router.push(`/liquid-funds/${fund.address}`)}
          className="group bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10
                   hover:border-white/20 transition-all duration-300 cursor-pointer
                   shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        >
          {/* Fund Name */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{fund.name}</h3>
            <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white/80 
                                 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Token List */}
          <div className="flex -space-x-2 mb-6">
            {fund.tokens?.map((tokenId, i) => (
              <div
                key={tokenId}
                className="relative w-8 h-8 rounded-full border-2 border-black/50 bg-black/50
                         first:ml-0 hover:z-10 transition-transform hover:scale-110"
                title={tokenId}
              >
                <Image
                  src={getTokenIconUrl(tokenId)}
                  alt={tokenId}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Price</span>
              </div>
              <p className="text-sm font-mono text-white">
                ${formatNumber(fund.price, 6)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">NAV</span>
              </div>
              <p className="text-sm font-mono text-white">
                ${formatNumber(fund.nav, 6)}M
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60">
                <Users className="h-4 w-4" />
                <span className="text-xs">Supply</span>
              </div>
              <p className="text-sm font-mono text-white">
                {formatNumber(fund.supply, 18)}
              </p>
            </div>
          </div>

          {/* Hover Indicator */}
          <div className="h-1 w-0 group-hover:w-full bg-primary mt-6 
                         transition-all duration-300 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
}; 