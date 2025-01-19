import { useEffect, useState } from 'react';
import { queryContract } from '@/utils/contract';
import { Address } from '@multiversx/sdk-core';

const VALORO_PROXY_ADDRESS = 'erd1qqqqqqqqqqqqqpgqd77h6vj8n4wc0l6z6wm4lxl0v4nyfww8fd8ss2077h';

export const useGetIndexFundAddresses = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await queryContract(
          'getIndexFundScs',
          [],
          VALORO_PROXY_ADDRESS
        );

        // The response is a VariadicValue containing an array of addresses
        const addressValues = response.firstValue?.valueOf() as string[] || [];
        const decodedAddresses = addressValues
          .filter(item => item !== '')
          .map(item => {
            const buffer = Buffer.from(item, 'base64');
            return new Address(buffer).bech32();
          });
        setAddresses(decodedAddresses);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch addresses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  return { addresses, isLoading, error };
}; 