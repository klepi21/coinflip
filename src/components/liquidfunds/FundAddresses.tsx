'use client'

import React from 'react';
import { useGetIndexFundAddresses } from '@/hooks/useGetIndexFundAddresses';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const FundAddresses = () => {
  const { addresses, isLoading, error } = useGetIndexFundAddresses();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load fund addresses: {error.message}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-stone-900 dark:text-white">
        Fund Addresses ({addresses.length})
      </h2>
      <div className="space-y-2">
        {addresses.map((address, index) => (
          <div key={index} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-lg">
            <div className="font-mono text-sm break-all text-stone-900 dark:text-white">
              {address}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}; 