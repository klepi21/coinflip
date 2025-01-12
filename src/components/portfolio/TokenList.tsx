'use client'

import React from 'react';
import { useGetTokens } from '@/hooks/useGetTokens';
import { TokenListItem } from './TokenListItem';
import { Loader2 } from 'lucide-react';

export const TokenList = () => {
  const { tokens, isLoading, error } = useGetTokens();

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
        <p className="text-red-500 dark:text-red-400">Failed to load tokens</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
        <thead className="bg-surface-light-hover dark:bg-surface-dark-hover">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Token
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Balance
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light dark:divide-border-dark">
          {tokens.map((token) => (
            <TokenListItem key={token.identifier} token={token} />
          ))}
        </tbody>
      </table>
    </div>
  );
};