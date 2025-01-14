import { useState, useEffect } from 'react';

interface PriceData {
  date: string;
  price: string;
}

interface PriceResponse {
  success: boolean;
  prices: PriceData[];
}

export const useGetFundPrices = (fundId: string) => {
  const [data, setData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        //console.log('Fetching prices for fund:', fundId);
        const response = await fetch(`/api/prices?fund=${fundId}`);
        //console.log('API Response:', response);
        const json: PriceResponse = await response.json();
        //console.log('Parsed JSON:', json);
        
        if (!json.success) {
          throw new Error('Failed to fetch price data');
        }

        setData(json.prices);
      } catch (err) {
        console.error('Error in useGetFundPrices:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch prices'));
      } finally {
        setIsLoading(false);
      }
    };

    if (fundId) {
      fetchPrices();
    }
  }, [fundId]);

  return { data, isLoading, error };
}; 