'use client'

import React from 'react';
import Image from 'next/image';

export interface TokenData {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  balance: string;
  price: number;
  valueUsd: number;
  icon?: string;
}

interface TokenListItemProps {
  token: TokenData;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  const formattedBalance = (Number(token.balance) / Math.pow(10, token.decimals)).toLocaleString(
    undefined,
    { maximumFractionDigits: 4 }
  );

  const formattedPrice = token.price.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  const formattedValue = token.valueUsd.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <tr className="hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {token.icon ? (
            <Image
              src={token.icon}
              alt={token.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-stone-200 dark:bg-stone-700 rounded-full" />
          )}
          <div className="ml-4">
            <div className="text-sm font-medium text-stone-900 dark:text-white">
              {token.name}
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-400">
              {token.ticker}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-stone-900 dark:text-white">
        {formattedBalance}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-stone-900 dark:text-white">
        {formattedPrice}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-stone-900 dark:text-white">
        {formattedValue}
      </td>
    </tr>
  );
};