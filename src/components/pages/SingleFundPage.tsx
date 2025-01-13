'use client'

import React, { useEffect, useState } from 'react';
import { useGetLiquidFundDetails } from '@/hooks/useGetLiquidFundDetails';
import { Card } from '@/components/ui/Card';
import { 
  Loader2, ArrowLeft, DollarSign, BarChart3, 
  Users, Activity, Percent, TrendingUp, ChevronRight, ClipboardCopy, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getTokenIconUrl } from '@/utils/tokens';
import { motion } from 'framer-motion';
import { SharesExchangeForm } from '../liquidfunds/SharesExchangeForm';
import { UserPosition } from '../liquidfunds/UserPosition';
import { useWallet } from '@/context/WalletContext';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";

interface SingleFundPageProps {
  address: string;
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}

interface FeeCardProps {
  label: string;
  value: string;
}

const InfoCard = ({ icon, label, value, valueClassName = '' }: InfoCardProps) => (
  <div className="p-4 bg-stone-100 dark:bg-stone-700 rounded-lg hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <div className="text-sm text-stone-500 dark:text-stone-400">{label}</div>
    </div>
    <div className={`text-lg font-semibold text-stone-900 dark:text-white ${valueClassName}`}>
      {value}
    </div>
  </div>
);

const FeeCard = ({ label, value }: FeeCardProps) => (
  <div className="p-4 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow duration-300">
    <div className="text-sm text-stone-500 dark:text-stone-400">{label}</div>
    <div className="text-lg font-semibold text-stone-900 dark:text-white flex items-center">
      <Percent className="h-4 w-4 mr-1" />
      {value}
    </div>
  </div>
);

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
    
    // Ensure the final result has 2 decimals
    return result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (err) {
    console.error('Error formatting balance:', err, { balance, decimals });
    return '0.00';
  }
};

// First, let's add some unique motion variants
const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Add isLoggedIn state (you'll need to get this from your wallet context)
const isLoggedIn = true; // Replace with actual wallet connection state

// Add a helper function to format the AUM value
const formatAUM = (value: string) => {
  const numValue = Number(value) / Math.pow(10, 6); // Convert to millions
  if (numValue >= 1) {
    return `$${numValue.toFixed(2)}`;
  }
  // If less than 1 million, show the regular dollar amount
  return `$${numValue.toFixed(2)}`;
};

// Constants as specified
const WAD = 1_000_000_000_000_000_000;
const SECONDS_PER_YEAR = 31556926;

// Updated calculation using the exact formula
const calculateApy = (aprValue: string | number) => {
  if (!aprValue) return 0;
  const apr = Number(aprValue);
  
  // APY = (1 + APR / WAD) ^ SPR - 1
  const apy = (Math.pow(1 + apr / WAD, SECONDS_PER_YEAR) - 1) * 100;
  return apy;
};

export const SingleFundPage = ({ address }: SingleFundPageProps) => {
  const { details, isLoading, error } = useGetLiquidFundDetails(address);
  const { address: userAddress } = useWallet();
  const [userFundBalance, setUserFundBalance] = useState('0');

  // Add this useEffect to fetch user's fund token balance
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!userAddress || !details?.fundTokenId) return;

      try {
        const response = await fetch(
          `https://devnet-api.multiversx.com/accounts/${userAddress}/tokens/${details.fundTokenId}`
        );
        const data = await response.json();
        
        if (data.balance) {
          setUserFundBalance((Number(data.balance) / Math.pow(10, data.decimals)).toString());
        }
      } catch (error) {
        console.error('Error fetching user fund balance:', error);
        setUserFundBalance('0');
      }
    };

    fetchUserBalance();
  }, [userAddress, details?.fundTokenId]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          Failed to load fund details: {error.message}
        </div>
      </div>
    );
  }

  if (!details) return null;

  const stats = [
    {
      label: "Price",
      value: `$${Number(details.price).toFixed(6)}`,
      icon: <DollarSign className="h-8 w-8 text-primary" />
    },
    {
      label: "Assets Under Management",
      value: formatAUM(details.nav),
      icon: <BarChart3 className="h-8 w-8 text-emerald-500" />
    },
    {
      label: "Total Supply",
      value: (Number(details.supply) / Math.pow(10, 18)).toFixed(4),
      icon: <Users className="h-8 w-8 text-blue-500" />
    },
    {
      label: "Status",
      value: details.isPaused ? "Paused" : "Active",
      icon: <Activity className="h-8 w-8 text-rose-500" />,
      customStyle: details.isPaused ? "text-red-400" : "text-green-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_100%)]" />
        {/* Add subtle animated grain effect */}
        <div className="absolute inset-0 opacity-20 bg-[url('/grain.png')] animate-grain" />
      </div>

      {/* Main content - Updated for mobile */}
      <div className="relative z-10 container mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-16">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-8"
          >
            <Link 
              href="/liquid-funds"
              className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors" />
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
              </div>
              <span className="font-medium text-sm sm:text-base">Back to Funds</span>
            </Link>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-7xl font-bold bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent"
          >
            {details.name}
          </motion.h1>
        </div>

        {/* Stats Row - Mobile responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className="sm:hidden">{React.cloneElement(stat.icon as React.ReactElement, { className: 'h-5 w-5' })}</div>
                <div className="hidden sm:block">{stat.icon}</div>
                <span className="text-white/60 text-xs sm:text-sm">{stat.label}</span>
              </div>
              <div className={`text-xl sm:text-4xl font-bold ${stat.customStyle || 'text-white'}`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add before the main grid */}
        {userAddress && (
          <div className="mb-8">
            <UserPosition
              fundTokenId={details.fundTokenId}
              fundTokenBalance={userFundBalance}
              fundPrice={details.price}
              totalFundSupply={details.supply}
              fundTokens={details.tokens}
            />
          </div>
        )}

        {/* Main Grid - Adjusted ratio to 2.5/1.5 */}
        <div className="flex flex-col lg:grid lg:grid-cols-8 gap-8 mb-8 sm:mb-16">
          {/* Fund Composition - Takes 5 columns (2.5/4) */}
          <motion.section 
            className="lg:col-span-5 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                       flex flex-col h-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-4 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8">Fund Composition</h2>
              <div className="space-y-2">
                {details.tokens.map((token, index) => {
  
                  
                  return (
                    <motion.div
                      key={token.identifier}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/40 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/10
                                hover:border-primary/50 transition-all duration-300"
                    >
                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        <div className="flex items-center justify-between mb-3">
                          {/* Token Info */}
                          <div className="flex items-center gap-2">
                            <Image
                              src={getTokenIconUrl(token.identifier)}
                              alt={token.identifier}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div>
                              <div className="text-base font-bold text-white">
                                {token.identifier}
                              </div>
                              <div className="text-white/60 text-xs">
                                {formatBalance(token.balance, token.decimals)}
                              </div>
                              <div className="text-2xl font-bold text-primary-500 mt-1 animate-pulse">
                                {formatBalance(token.base_token_equivalent.toString(), token.base_token_decimals)}
                                &nbsp;{token.identifier.split('-')[0].replace(/^H/, '')}
                              </div>
                            </div>
                          </div>
                          {/* Weight */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {token.weight}%
                            </div>
                            <div className="text-white/60 text-xs">
                              Allocation
                            </div>
                          </div>
                        </div>
                        {/* APY Section for Mobile */}
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-lg p-2 flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-emerald-500">
                              {calculateApy(token.apr) >= 100 
                                ? calculateApy(token.apr).toFixed(1) + '%'
                                : calculateApy(token.apr).toFixed(2) + '%'
                              }
                            </div>
                            <div className="text-emerald-400 text-xs">APY</div>
                          </div>
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center justify-between gap-4">
                        {/* Token Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Image
                            src={getTokenIconUrl(token.identifier)}
                            alt={token.identifier}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div>
                            <div className="text-lg font-bold text-white">
                              {token.identifier}
                            </div>
                            <div className="text-white/60 font-mono text-xs">
                              {formatBalance(token.balance, token.decimals)}
                              &nbsp;
                              {token.identifier}
                            </div>
                            <div className="text-lg font-bold text-primary-500 mt-1 animate-pulse">
                              {formatBalance(token.base_token_equivalent.toString(), token.base_token_decimals)}
                              &nbsp;{token.identifier.split('-')[0].replace(/^H/, '')}
                            </div>
                          </div>
                        </div>

                        {/* Weight */}
                        <div className="text-center px-6 border-x border-white/10">
                          <div className="text-2xl font-bold text-white">
                            {token.weight}%
                          </div>
                          <div className="text-white/60 text-sm">
                            Allocation
                          </div>
                        </div>

                        {/* APY with trending icon */}
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3">
                          <div>
                            <div className="text-2xl font-bold text-emerald-500">
                              {calculateApy(token.apr) >= 100 
                                ? calculateApy(token.apr).toFixed(1) + '%'
                                : calculateApy(token.apr).toFixed(2) + '%'
                              }
                            </div>
                            <div className="text-emerald-400 text-sm flex items-center gap-1.5">
                              APY
                            </div>
                          </div>
                          <div className="w-px h-8 bg-emerald-500/20" />
                          <motion.div
                            initial={{ rotate: -45 }}
                            animate={{ rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20
                            }}
                          >
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Trading Interface - Takes 3 columns (1.5/4) */}
          <motion.section
            className="lg:col-span-3 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <SharesExchangeForm 
              sharePrice={details.price}
              fundAddress={address}
              fundTokenId={details.fundTokenId}
              buyFee={details.fees.protocol.buy}
              sellFee={details.fees.protocol.withdraw}
            />
          </motion.section>
        </div>

        {/* Bottom Grid - Stack on mobile */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
          {/* Token Details - Updated design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02]">
              <h3 className="text-2xl font-bold text-white">Token Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="group hover:bg-white/[0.02] rounded-xl p-4 transition-all duration-300">
                  <div className="text-white/60 text-sm mb-2">Fund Token ID</div>
                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <code className="text-white/90 font-mono text-sm">{details.fundTokenId}</code>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <ClipboardCopy className="h-4 w-4 text-white/60" />
                      </button>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <ExternalLink className="h-4 w-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="group hover:bg-white/[0.02] rounded-xl p-4 transition-all duration-300">
                  <div className="text-white/60 text-sm mb-2">Smart Contract</div>
                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <code className="text-white/90 font-mono text-sm">
                      {`${address.slice(0, 8)}...${address.slice(-8)}`}
                    </code>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <ClipboardCopy className="h-4 w-4 text-white/60" />
                      </button>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <ExternalLink className="h-4 w-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fee Structure - Updated design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02]">
              <h3 className="text-2xl font-bold text-white">Fee Structure</h3>
            </div>
            <div className="p-6 space-y-8">
              {/* Protocol Fees */}
              <div className="space-y-4">
                <div className="text-lg text-white/80">Protocol Fees</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Buy", value: details.fees.protocol.buy },
                    { label: "Sell", value: details.fees.protocol.withdraw },
                    { label: "Performance", value: details.fees.protocol.performance }
                  ].map((fee, index) => (
                    <div key={index} 
                         className="bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-4 
                                   transition-all duration-300 group"
                    >
                      <div className="text-white/60 text-sm mb-1">{fee.label}</div>
                      <div className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {fee.value}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Fees */}
              <div className="space-y-4">
                <div className="text-lg text-white/80">Manager Fees</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Buy", value: details.fees.manager.buy },
                    { label: "Sell", value: details.fees.manager.withdraw },
                    { label: "Performance", value: details.fees.manager.performance }
                  ].map((fee, index) => (
                    <div key={index} 
                         className="bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-4 
                                   transition-all duration-300 group"
                    >
                      <div className="text-white/60 text-sm mb-1">{fee.label}</div>
                      <div className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {fee.value}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 