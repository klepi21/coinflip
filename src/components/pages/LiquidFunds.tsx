'use client'

import React from 'react';
import { useGetIndexFundAddresses } from '@/hooks/useGetIndexFundAddresses';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import { LiquidFundsTable } from '@/components/liquidfunds/LiquidFundsTable';

export const LiquidFunds = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
          Liquid Funds
        </h1>
      </div>
      <Card>
        <LiquidFundsTable />
      </Card>
    </div>
  );
}; 