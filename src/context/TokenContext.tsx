import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

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
  const { address } = useWallet();

  const fetchBalances = async () => {
    if (!address) {
      setBalances({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Add 500ms delay before fetching balances
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(`https://api.multiversx.com/accounts/${address}/tokens?size=500`);
      const tokens = await response.json();
      
      const newBalances: TokenBalances = {};
      tokens.forEach((token: any) => {
        newBalances[token.identifier] = Number(token.balance) / Math.pow(10, token.decimals);
      });
      
      setBalances(newBalances);
      setError(null);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch balances'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Set up refresh interval (optional)
    const interval = setInterval(fetchBalances, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [address]);

  return (
    <TokenContext.Provider value={{ balances, isLoading, error, refreshBalances: fetchBalances }}>
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