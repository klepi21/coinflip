'use client'

import React from 'react';
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
  if (!balance) return '0';
  
  // Ensure decimals is within valid range (0-20)
  const maxDecimals = Math.min(decimals, 20);
  
  const balanceValue = 
    Number(BigInt(balance)) / Math.pow(10, decimals);

  return balanceValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals
  });
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

export const SingleFundPage = ({ address }: SingleFundPageProps) => {
  const { details, isLoading, error } = useGetLiquidFundDetails(address);

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

      {/* Main content - Updated spacing and styling */}
      <div className="relative z-10 container mx-auto px-8 pt-24 pb-16">
        {/* Header Section with Back Button */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-8 mb-8"
          >
            <Link 
              href="/liquid-funds"
              className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors" />
                <ArrowLeft className="h-5 w-5 relative z-10" />
              </div>
              <span className="font-medium">Back to Funds</span>
            </Link>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl font-bold bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent"
          >
            {details.name}
          </motion.h1>
        </div>

        {/* Stats Row - Enhanced glassmorphism */}
        <div className="grid grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                       hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center gap-4 mb-4">
                {stat.icon}
                <span className="text-white/60">{stat.label}</span>
              </div>
              <div className={`text-4xl font-bold ${stat.customStyle || 'text-white'}`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid - Updated for consistent heights */}
        <div className="grid grid-cols-2 gap-8 mb-16">
          {/* Fund Composition */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10
                       hover:border-white/20 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                       flex flex-col h-[600px]" // Fixed height
          >
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-8">Fund Composition</h2>
              <div className="space-y-2 overflow-y-auto max-h-[480px] pr-2">
                {details.tokens.map((token, index) => (
                  <motion.div
                    key={token.identifier}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10
                              hover:border-primary/50 transition-all duration-300
                              flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={getTokenIconUrl(token.identifier)}
                        alt={token.identifier}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-lg font-bold text-white">
                          {token.identifier.split('-')[0]}
                        </div>
                        <div className="text-white/60 font-mono text-xs">
                          {token.identifier}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-0.5">
                        {token.weight}%
                      </div>
                      <div className="text-white/60 text-sm">
                        {formatBalance(token.balance, token.decimals)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Trading Interface - Matched height */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="h-[600px]" // Fixed height
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

        {/* Bottom Grid - Enhanced styling */}
        <div className="grid grid-cols-2 gap-8">
          {/* Token Details & Fee Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10
                     hover:border-white/20 transition-all duration-300
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                     hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Token Details</h3>
            <div className="space-y-6">
              <div>
                <div className="text-white/60 mb-2">Fund Token ID</div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                  <code className="text-white font-mono">{details.fundTokenId}</code>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <ClipboardCopy className="h-5 w-5 text-white/60" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink className="h-5 w-5 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-2">Smart Contract</div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                  <code className="text-white font-mono">
                    {`${address.slice(0, 8)}...${address.slice(-8)}`}
                  </code>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <ClipboardCopy className="h-5 w-5 text-white/60" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink className="h-5 w-5 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fee Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10
                     hover:border-white/20 transition-all duration-300
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                     hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Fee Structure</h3>
            <div className="space-y-8">
              {/* Protocol Fees */}
              <div>
                <div className="text-xl text-white/80 mb-4">Protocol Fees</div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Buy", value: details.fees.protocol.buy },
                    { label: "Sell", value: details.fees.protocol.withdraw },
                    { label: "Performance", value: details.fees.protocol.performance }
                  ].map((fee, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/60 mb-1">{fee.label}</div>
                      <div className="text-2xl font-bold text-white">{fee.value}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Fees */}
              <div>
                <div className="text-xl text-white/80 mb-4">Manager Fees</div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Buy", value: details.fees.manager.buy },
                    { label: "Sell", value: details.fees.manager.withdraw },
                    { label: "Performance", value: details.fees.manager.performance }
                  ].map((fee, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/60 mb-1">{fee.label}</div>
                      <div className="text-2xl font-bold text-white">{fee.value}%</div>
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