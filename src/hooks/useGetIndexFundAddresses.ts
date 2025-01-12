import { useEffect, useState, useRef } from 'react';
import { queryContract } from '../utils/contract';
import { Address, AddressValue } from '@multiversx/sdk-core';

export const useGetIndexFundAddresses = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAddresses = async () => {
      try {
        const response = await queryContract(
          'getIndexFundScs',
          [],
          ['variadic<Address>']
        );

        if (response?.returnData && Array.isArray(response.returnData)) {
          const decoded = response.returnData.map((base64Str: string) => {
            try {
              // Convert base64 to buffer
              const buffer = Buffer.from(base64Str, 'base64');
              // Create Address from buffer
              const address = new Address(buffer);
              // Convert to bech32
              return address.bech32();
            } catch (err) {
              console.error('Error decoding address:', err);
              return '';
            }
          }).filter(Boolean);

          console.log('Decoded addresses:', decoded);
          setAddresses(decoded);
          setError(null);
        } else {
          throw new Error('Invalid response format from contract');
        }
      } catch (err: any) {
        console.error('Error fetching fund addresses:', err);
        setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  return { addresses, isLoading, error };
}; 