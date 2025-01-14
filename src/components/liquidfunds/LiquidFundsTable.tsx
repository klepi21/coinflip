'use client'

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, Loader2, Coins, LineChart } from 'lucide-react';
import { useGetLiquidFunds } from '@/hooks/useGetLiquidFunds';
import Image from 'next/image';
import { Meteors } from '@/components/ui/meteors';
import { useState, useEffect } from 'react';
import NumberFlow from '@/components/ui/number-flow';

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
  const [displayMode, setDisplayMode] = useState<'usd' | 'egld'>('usd');
  const [egldPrice, setEgldPrice] = useState<number>(0);
  
  // Fetch EGLD price
  useEffect(() => {
    const fetchEgldPrice = async () => {
      try {
        const response = await fetch('https://api.multiversx.com/economics');
        const data = await response.json();
        setEgldPrice(data.price);
      } catch (error) {
        console.error('Error fetching EGLD price:', error);
      }
    };
    fetchEgldPrice();
  }, []);

  // Calculate total value locked
  const calculateTotalValueLocked = () => {
    if (!funds?.length) return 0;
    
    const totalUsdValue = funds.reduce((sum, fund) => {
      try {
        // Convert nav from hex to decimal, considering 6 decimals (USDC)
        const navValue = Number(BigInt('0x' + fund.nav)) / Math.pow(10, 6);
        return sum + (isNaN(navValue) ? 0 : navValue);
      } catch (err) {
        console.error('Error calculating nav for fund:', err);
        return sum;
      }
    }, 0);

    if (isNaN(totalUsdValue)) return 0;
    return displayMode === 'usd' ? totalUsdValue : (egldPrice ? totalUsdValue / egldPrice : 0);
  };

  const getTokenIconUrl = (identifier: string) => {
    return `https://tools.multiversx.com/assets-cdn/devnet/tokens/${identifier}/icon.png`;
  };

  // Ensure funds are displayed without filtering
  const displayedFunds = funds; // Use funds directly without filtering

  return (
    <div className="space-y-8">
      {/* Total Value Locked Component */}
      <div className="relative">
        <div 
          onClick={() => setDisplayMode(prev => prev === 'usd' ? 'egld' : 'usd')}
          className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 
                    hover:border-white/20 transition-all duration-300 p-6 cursor-pointer
                    overflow-hidden group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-white/10 to-primary/30 
                          opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
          
          {/* Add Meteors */}
          <Meteors number={6} />

          {/* Content container */}
          <div className="relative flex justify-between items-center">
            {/* TVL Content */}
            <div>
              <h2 className="text-lg font-medium text-white/60 mb-2">
                Total Value Locked
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {displayMode === 'usd' ? '$' : ''}
                </span>
                <div className="text-4xl font-bold text-white">
                  <NumberFlow 
                    value={calculateTotalValueLocked()} 
                    trend={false}
                    duration={0.6}
                  />
                </div>
                {displayMode === 'egld' && (
                  <span className="text-xl font-medium text-white/60 ml-2">
                    EGLD
                  </span>
                )}
              </div>
              <div className="text-sm text-white/40 mt-2">
                Click to toggle USD/EGLD
              </div>
            </div>

            {/* Wen Lambo Text */}
            <div className="relative">
              <span className="text-[8rem] font-bold text-white/5 select-none
                              tracking-tighter leading-none whitespace-nowrap
                              hover:text-white/10 transition-colors duration-300">
                Wen Lambo?
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Funds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayedFunds.map((fund, index) => (
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
    </div>
  );
}; 