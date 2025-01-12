'use client'

import React from 'react';
import { LiquidFundsTable } from '@/components/liquidfunds/LiquidFundsTable';

export const LiquidFunds = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">Liquid Funds</h1>
      <LiquidFundsTable />
    </div>
  );
}; 