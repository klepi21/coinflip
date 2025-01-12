import { useEffect, useState } from 'react';
import { queryContract } from '../utils/contract';
import { IContractQueryResponse } from '@multiversx/sdk-core';

interface QueryResult {
  values: any[];
}

export const useGetLiquidFundInfo = (contractAddress: string) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFundInfo = async () => {
      console.log('Fetching fund info for address:', contractAddress);
      try {
        const responses = (await Promise.all([
          queryContract('getFundName', [], ['bytes']),
          queryContract('getFundTokens', [], ['variadic<TokenIdentifier>']),
          queryContract('getFundSupply', [], ['BigUint']),
          queryContract('getNetAssetsValue', [], ['BigUint']),
          queryContract('getIndexFundPrice', [], ['BigUint']),
          queryContract('getIsScInitialized', [], ['bool']),
          queryContract('getIsScPaused', [], ['bool']),
          queryContract('getIndexFundManager', [], ['Address'])
        ])) as IContractQueryResponse[];

        const processedData = {
          name: new TextDecoder().decode(responses[0].getReturnDataParts()[0] ?? ''),
          tokens: responses[1].getReturnDataParts()[0],
          supply: responses[2].getReturnDataParts()[0]?.toString() ?? '0',
          nav: responses[3].getReturnDataParts()[0]?.toString() ?? '0',
          price: responses[4].getReturnDataParts()[0]?.toString() ?? '0',
          isInitialized: Boolean(responses[5].getReturnDataParts()[0]),
          isPaused: Boolean(responses[6].getReturnDataParts()[0]),
          manager: responses[7].getReturnDataParts()[0]?.toString() ?? '',
        };

        console.log('Processed data in hook:', processedData);
        setData(processedData);
      } catch (err: any) {
        console.error('Error in useGetLiquidFundInfo:', err);
        setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    if (contractAddress) {
      fetchFundInfo();
    }
  }, [contractAddress]);

  return { data, isLoading, error };
}; 