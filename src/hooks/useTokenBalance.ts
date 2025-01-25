import { useEffect, useState } from 'react';

export const useTokenBalance = (address: string | undefined, tokenId: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance(0);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://multiversx-api.beaconx.app/public-mainnet-api/accounts/${address}/tokens?size=500`);
        const tokens = await response.json();
        const token = tokens.find((t: any) => t.identifier === tokenId);
        
        if (token) {
          const balance = Number(token.balance) / Math.pow(10, token.decimals);
          setBalance(balance);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [address, tokenId]);

  return { balance, isLoading };
}; 