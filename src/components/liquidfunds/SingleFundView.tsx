'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, BarChart, Wallet, DollarSign, Percent, TrendingUp, Loader2 } from 'lucide-react';
import { liquidFunds, LiquidFund } from '@/data/liquidFunds';
import Image from 'next/image';
import { useGetLiquidFundInfo } from '@/hooks/useGetLiquidFundInfo';
import { useGetLiquidFundDetails } from '@/hooks/useGetLiquidFundDetails';
import { AbiRegistry, ResultsParser, BigUIntValue } from '@multiversx/sdk-core';
import liquidFundAbi from '@/config/valoro_liquid_fund_template_sc.abi.json';

interface SingleFundViewProps {
  address: string;
}

interface FundHolding {
  token: string;
  identifier: string;
  allocation: number;
  amount: string;
  price: number;
  change24h: number;
  value: number;
  apr: number;
}

interface TokenInfo {
  identifier: string;
  weight: number;
  balance: string;
  decimals: number;
  apr: string;
}

const WAD = BigInt('1000000000000000000');
const SECONDS_PER_YEAR = 31556926;

const calculateApy = (aprValue: string | number) => {
  if (!aprValue) return 0;
  const apr = BigInt(aprValue);
  const base = WAD + apr;
  const exponent = SECONDS_PER_YEAR;
  
  const apy = (Math.pow(Number(base) / Number(WAD), exponent) - 1) * 100;
  return apy;
};

export const SingleFundView = ({ params }: { params: { address: string } }) => {
  console.log('=== COMPONENT MOUNTED ===', { 
    time: new Date().toISOString(),
    address: params.address 
  });

  
  const { data: fundInfo, isLoading, error } = useGetLiquidFundInfo(params.address);
  const { details: fundDetails, isLoading: detailsLoading } = useGetLiquidFundDetails(params.address);

 

  // Wait for both data sources to be loaded
  if (isLoading || detailsLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (error) return <div>Error: {error.message}</div>;
  if (!fundInfo || !fundDetails) return null;

  // Use the tokens directly from fundDetails instead of merging
  const tokensWithApr = fundDetails.tokens;

  console.log('Token data being rendered:', fundInfo.tokens);

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const formatBalance = (balance: string, decimals: number) => {
    if (!balance) return '0';
    const cleanBalance = balance.replace('.', '');
    const value = BigInt(cleanBalance);
    const divisor = BigInt(10 ** decimals);
    
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    
    return `${wholePart}.${fractionalStr.slice(0, 6)}`;
  };

  const formatApr = (aprValue: string | number) => {
    if (!aprValue) return '0.00%';
    const apr = Number(aprValue) / Math.pow(10, 8);
    return apr.toFixed(2) + '%';
  };

  console.log('Tokens being rendered:', tokensWithApr);

  console.log('=== RENDER DATA ===');
  console.log('tokensWithApr:', tokensWithApr);
  console.log('First token apr:', tokensWithApr?.[0]?.apr);

  console.log('Debug render:', {
    hasFundDetails: !!fundDetails,
    tokens: fundDetails?.tokens,
    firstToken: fundDetails?.tokens?.[0],
    firstTokenApr: fundDetails?.tokens?.[0]?.apr
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/liquid-funds"
          className="inline-flex items-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Funds
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
          {fundInfo.name}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-stone-600 dark:text-stone-400">Price</h3>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            ${formatBalance(fundInfo.price, 18)}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-stone-600 dark:text-stone-400">NAV</h3>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            ${formatBalance(fundInfo.nav, 18)}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-stone-600 dark:text-stone-400">Supply</h3>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {formatBalance(fundInfo.supply, 18)}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-stone-600 dark:text-stone-400">Status</h3>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {fundInfo.isPaused ? 'Paused' : 'Active'}
          </p>
        </div>
      </div>

      {/* Fees Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6">Fees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Protocol Fees</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Buy</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.protocol.buy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Withdraw</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.protocol.withdraw)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Performance</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.protocol.performance)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Manager Fees</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Buy</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.manager.buy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Withdraw</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.manager.withdraw)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">Performance</span>
                <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(fundInfo.fees.manager.performance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Composition */}
      <div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6">Fund Composition</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundDetails.tokens.map((token: TokenInfo, index: number) => (
            <div key={index} className="relative p-6 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              {/* APR & APY Badge */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                  <div className="text-xs text-primary font-medium mb-0.5">APR</div>
                  <div className="text-lg font-bold text-primary">
                    {formatApr(token.apr)}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                  <div className="text-xs text-emerald-500 font-medium mb-0.5">APY</div>
                  <div className="text-lg font-bold text-emerald-500">
                    {calculateApy(token.apr).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Token Info */}
              <div className="flex items-center gap-3 mb-4 mt-12">
                <Image
                  src={`https://tools.multiversx.com/assets-cdn/devnet/tokens/${token.identifier}/icon.png`}
                  alt={token.identifier}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white">{token.identifier}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Weight</span>
                  <span className="font-medium text-stone-900 dark:text-white">{formatPercentage(token.weight)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Balance</span>
                  <span className="font-medium text-stone-900 dark:text-white">{formatBalance(token.balance, token.decimals)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 