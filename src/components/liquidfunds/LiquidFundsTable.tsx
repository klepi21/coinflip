'use client'

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import { useGetLiquidFunds } from '@/hooks/useGetLiquidFunds';
import Image from 'next/image';

const WAD = BigInt('1000000000000000000');
const SECONDS_PER_YEAR = 31556926;

const calculateApy = (aprValue: string | number) => {
  if (!aprValue) return 0;
  const apr = Number(aprValue);
  const apy = (Math.pow(1 + apr / Number(WAD), SECONDS_PER_YEAR) - 1) * 100;
  return apy;
};

const formatBalance = (balance: string, decimals: number, type?: 'supply' | 'nav') => {
  try {
    if (!balance) return '0';
    // Convert hex string to BigInt
    const value = BigInt('0x' + balance);
    const divisor = BigInt(10 ** decimals);
    
    // Always divide by decimals, even for supply
    const result = Number(value) / Number(divisor);
    
    if (type === 'supply') {
      // For supply, show with no decimals
      return result.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } else if (type === 'nav') {
      // For NAV, show with 2 decimals
      return result.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // For other values (price), show with up to 6 decimals
    return result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  } catch (err) {
    console.error('Error formatting balance:', err);
    return '0.00';
  }
};

const formatNumber = (value: string, decimals: number, type?: 'supply' | 'nav') => {
  try {
    if (!value || value === '0') return '0.00';
    return formatBalance(value, decimals, type);
  } catch (err) {
    console.error('Error formatting number:', err);
    return '0.00';
  }
};

export const LiquidFundsTable = () => {
  const router = useRouter();
  const { funds, isLoading, error } = useGetLiquidFunds();

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
      {funds?.filter(fund => {
        try {
          // Check if values exist and are not empty
          if (!fund.nav || !fund.supply || fund.nav === '0' || fund.supply === '0') {
            return false;
          }
          
          // Convert hex values to numbers for comparison
          const navValue = Number(BigInt('0x' + fund.nav)) / Math.pow(10, 6);
          const supplyValue = Number(BigInt('0x' + fund.supply)) / Math.pow(10, 18);
          
          // Only show funds with NAV and supply greater than 1
          return navValue > 1 && supplyValue > 1;
        } catch (err) {
          console.error('Error filtering fund:', err);
          return false;
        }
      }).map((fund, index) => (
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
            {fund.tokens?.map((tokenId: string, i: number) => (
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
                ${formatNumber(fund.nav, 6, 'nav')}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60">
                <Users className="h-4 w-4" />
                <span className="text-xs">Supply</span>
              </div>
              <p className="text-sm font-mono text-white">
                {formatNumber(fund.supply, 18, 'supply')}
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