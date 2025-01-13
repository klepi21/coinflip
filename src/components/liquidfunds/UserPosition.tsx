import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Wallet, DollarSign, BarChart3, TrendingUp, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { getTokenIconUrl } from '@/utils/tokens';
import { Meteors } from "@/components/ui/meteors";

interface UserPositionProps {
  fundTokenId: string;
  fundTokenBalance: string;
  fundPrice: string;
  totalFundSupply: string;
  fundTokens: {
    identifier: string;
    balance: string;
    decimals: number;
    weight: number;
    apr: string | number;
    base_token_equivalent: string | number;
    base_token_decimals: number;
  }[];
}

// Add the formatBalance helper function
const formatBalance = (balance: string, decimals: number) => {
  try {
    if (!balance) return '0';
    
    // Handle scientific notation and convert to a number without the power of 10
    const number = balance.includes('e') ? 
      Number(balance.split('e')[0]) * Math.pow(10, Number(balance.split('e')[1])) : 
      Number(balance);
    
    // Convert to BigInt safely
    const bigIntValue = BigInt(number);
    const divisor = BigInt(10 ** decimals);
    
    // Convert to number after division
    const result = Number(bigIntValue) / Number(divisor);
    
    return result.toFixed(2);
  } catch (err) {
    console.error('Error formatting balance:', err, { balance, decimals });
    return '0.00';
  }
};

// Update the calculateTokenBalance function
const calculateTokenBalance = (
  fundTokenBalance: string,
  tokenBalance: string,
  tokenWeight: number,
  tokenDecimals: number,
  totalFundSupply: string
) => {
  try {
    // Convert values to numbers first to avoid BigInt precision issues
    const userBalance = Number(fundTokenBalance);
    const totalSupply = Number(totalFundSupply) / 1e18; // Adjust for 18 decimals
    const tokenTotal = Number(tokenBalance) / Math.pow(10, tokenDecimals);

    // Calculate user's share of the fund
    const userShare = userBalance / totalSupply;
    
    // Calculate user's portion of the token
    const userTokenBalance = tokenTotal * userShare;
    
    return userTokenBalance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error calculating token balance:', error);
    console.log('Debug values:', {
      fundTokenBalance,
      tokenBalance,
      tokenWeight,
      tokenDecimals,
      totalFundSupply
    });
    return '0.00';
  }
};

// Add these constants for APY calculation
const WAD = 1_000_000_000_000_000_000;
const SECONDS_PER_YEAR = 31556926;

// Add the calculateApy function
const calculateApy = (aprValue: string | number) => {
  if (!aprValue) return 0;
  const apr = Number(aprValue);
  const apy = (Math.pow(1 + apr / WAD, SECONDS_PER_YEAR) - 1) * 100;
  return apy;
};

// Add function to calculate weighted average APY
const calculateAverageApy = (tokens: Array<{ apr: string | number; weight: number }>) => {
  const weightedApys = tokens.map(token => {
    const apy = calculateApy(token.apr);
    return (apy * token.weight) / 100; // Weight is in percentage
  });
  
  const averageApy = weightedApys.reduce((sum, apy) => sum + apy, 0);
  return averageApy;
};

export const UserPosition = ({ 
  fundTokenId, 
  fundTokenBalance, 
  fundPrice,
  totalFundSupply,
  fundTokens 
}: UserPositionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dollarValue = Number(fundTokenBalance) * Number(fundPrice);

  return (
    <div className="relative h-full w-full">
      {/* Main Content */}
      <div className="relative h-full w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 
                      hover:border-white/20 transition-all duration-300 
                      shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 overflow-hidden">
        {/* Meteors with exact same styling as LiquidFundsTable */}
        <div className="absolute inset-0 h-full w-full">
          <Meteors number={20} className="opacity-0 group-hover/meteors:opacity-100" />
        </div>

        {/* Rest of content */}
        <div className="relative z-10">
          {/* Main Summary - Always Visible */}
          <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Your Position</h2>
              </div>
              <motion.button
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-white/60" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fund Token Balance */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Balance</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {Number(fundTokenBalance).toFixed(4)}
                </div>
                <div className="text-sm text-white/40 font-mono mt-1">
                  {fundTokenId}
                </div>
              </div>

              {/* Dollar Value */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Value</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ${dollarValue.toFixed(2)}
                </div>
                <div className="text-sm text-white/40 mt-1">
                  @ ${Number(fundPrice).toFixed(6)} per share
                </div>
              </div>

              {/* Average APY */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Average APY</span>
                </div>
                <div className="text-xl font-bold text-emerald-400">
                  {calculateAverageApy(fundTokens).toFixed(2)}%
                </div>
                <div className="text-sm text-white/40 mt-1">
                  weighted average
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Token Breakdown */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-4">Estimated Token Allocation</div>
                    <div className="space-y-4">
                      {fundTokens.map((token) => {
                        const userTokenBalance = calculateTokenBalance(
                          fundTokenBalance,
                          token.balance,
                          token.weight,
                          token.decimals,
                          totalFundSupply
                        );
                        
                        // Calculate base token equivalent
                        const userBaseTokenBalance = calculateTokenBalance(
                          fundTokenBalance,
                          token.base_token_equivalent.toString(),
                          token.weight,
                          token.base_token_decimals,
                          totalFundSupply
                        );
                        
                        return (
                          <div key={token.identifier} className="flex items-center gap-4">
                            <Image
                              src={getTokenIconUrl(token.identifier)}
                              alt={token.identifier}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium">
                                {token.identifier}
                              </div>
                              <div className="text-white/60 text-sm">
                                {token.weight}% allocation
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">
                                {userTokenBalance}
                              </div>
                              <div className="text-primary-500 text-sm font-medium animate-pulse">
                                {userBaseTokenBalance} {token.identifier.split('-')[0].replace(/^H/, '')}
                              </div>
                              <div className="text-white/60 text-xs">
                                estimated balance
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 