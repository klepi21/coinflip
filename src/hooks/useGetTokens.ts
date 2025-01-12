'use client'

import { useState, useEffect } from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { TokenData } from '@/components/portfolio/TokenListItem';

export const useGetTokens = () => {
  const { address } = useGetAccountInfo();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!address) {
        setTokens([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://devnet-api.multiversx.com/accounts/${address}/tokens`);
        if (!response.ok) throw new Error('Failed to fetch tokens');
        
        const data = await response.json();
        const mappedTokens: TokenData[] = data.map((token: any) => ({
          identifier: token.identifier,
          name: token.name,
          ticker: token.ticker,
          decimals: token.decimals,
          balance: token.balance,
          price: token.price || 0,
          valueUsd: token.balance * (token.price || 0),
          icon: token.assets?.svgUrl
        }));

        setTokens(mappedTokens);
        setError(null);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [address]);

  return { tokens, isLoading, error };
};