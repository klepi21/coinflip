'use client'

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, Loader2, Coins, LineChart } from 'lucide-react';
import { useGetLiquidFunds } from '@/hooks/useGetLiquidFunds';
import Image from 'next/image';
import { Meteors } from '@/components/ui/meteors';

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
          if (!fund.nav || !fund.supply || fund.nav === '0' || fund.supply === '0') {
            return false;
          }
          
          const navValue = Number(BigInt('0x' + fund.nav)) / Math.pow(10, 6);
          const supplyValue = Number(BigInt('0x' + fund.supply)) / Math.pow(10, 18);
          
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
          className="group relative p-8 rounded-3xl cursor-pointer
                     before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-b 
                     before:from-white/10 before:to-white/5 before:backdrop-blur-xl
                     hover:before:from-white/20 hover:before:to-white/10
                     after:absolute after:inset-0 after:rounded-3xl after:border after:border-white/10
                     hover:after:border-white/20 after:transition-colors
                     overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-white/10 to-primary/30 
                          opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
          
          {/* Add Meteors here */}
          <Meteors number={10} /> {/* Reduced number for better performance */}

          {/* Content container */}
          <div className="relative">
            {/* Fund Name */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                {fund.name}
              </h3>
              <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-primary 
                            group-hover:translate-x-1 transition-all duration-300" />
            </div>

            {/* Token List */}
            <div className="flex -space-x-3 mb-8">
              {fund.tokens?.map((tokenId: string, i: number) => (
                <div
                  key={tokenId}
                  className="relative w-10 h-10 rounded-full ring-2 ring-black/50 bg-black/50
                             first:ml-0 hover:z-10 transition-all duration-300
                             hover:scale-110 hover:ring-primary/50"
                  title={tokenId}
                >
                  <Image
                    src={getTokenIconUrl(tokenId)}
                    alt={tokenId}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
              ))}
            </div>

            {/* Key Metrics - Compact Stack */}
            <div className="flex flex-col gap-2 mt-6">
              {/* Price Box */}
              <div className="group/metric flex items-center justify-between py-2.5 px-4 bg-black/10 rounded-lg border border-white/5 hover:bg-black/20 transition-all">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary/80" />
                  <span className="text-sm text-white/50">Price</span>
                </div>
                <p className="font-mono text-white/90">
                  ${formatNumber(fund.price, 6)}
                </p>
              </div>

              {/* AUM Box */}
              <div className="group/metric flex items-center justify-between py-2.5 px-4 bg-black/10 rounded-lg border border-white/5 hover:bg-black/20 transition-all">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary/80" />
                  <span className="text-sm text-white/50">AUM</span>
                </div>
                <p className="font-mono text-white/90">
                  ${formatNumber(fund.nav, 6, 'nav')}
                </p>
              </div>

              {/* Supply Box */}
              <div className="group/metric flex items-center justify-between py-2.5 px-4 bg-black/10 rounded-lg border border-white/5 hover:bg-black/20 transition-all">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary/80" />
                  <span className="text-sm text-white/50">Supply</span>
                </div>
                <p className="font-mono text-white/90">
                  {formatNumber(fund.supply, 18, 'supply')}
                </p>
              </div>
            </div>

            {/* Hover line indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent 
                            translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 
                            transition-all duration-500" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 