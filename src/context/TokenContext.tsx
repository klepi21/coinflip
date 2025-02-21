import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { usePathname } from 'next/navigation';

interface TokenBalances {
  [key: string]: number;
}

interface TokenContextType {
  balances: TokenBalances;
  isLoading: boolean;
  error: Error | null;
  refreshBalances: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { address } = useWallet();
  const pathname = usePathname();

  const fetchBalances = async (forceDelay = false) => {
    if (!address) {
      setBalances({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Calculate time since last fetch
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;

      // If force delay or less than 2 seconds since last fetch, add delay
      if (forceDelay || timeSinceLastFetch < 2000) {
        // Add 2 second delay for page changes, 500ms for regular updates
        const delayTime = forceDelay ? 2000 : 500;
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
      
      const response = await fetch(`https://api.multiversx.com/accounts/${address}/tokens?size=500`);
      const tokens = await response.json();
      
      const newBalances: TokenBalances = {};
      tokens.forEach((token: any) => {
        newBalances[token.identifier] = Number(token.balance) / Math.pow(10, token.decimals);
      });
      
      setBalances(newBalances);
      setError(null);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch balances'));
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for handling page changes
  useEffect(() => {
    if (address) {
      fetchBalances(true); // Force delay on page change
    }
  }, [pathname, address]);

  // Effect for regular balance updates
  useEffect(() => {
    if (!address) return;

    // Initial fetch without forced delay
    fetchBalances(false);

    // Set up refresh interval
    const interval = setInterval(() => {
      fetchBalances(false);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [address]);

  return (
    <TokenContext.Provider value={{ balances, isLoading, error, refreshBalances: () => fetchBalances(false) }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokenContext() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
}

// Utility hook for getting specific token balance
export function useTokenBalance(tokenId: string) {
  const { balances, isLoading, error } = useTokenContext();
  return {
    balance: balances[tokenId] || 0,
    isLoading,
    error
  };
} 