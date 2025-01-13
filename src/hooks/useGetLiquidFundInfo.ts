import { useEffect, useState } from 'react';
import { queryContract } from '../utils/contract';
import { IContractQueryResponse } from '@multiversx/sdk-core';
import liquidFundAbi from '@/config/valoro_liquid_fund_template_sc.abi.json';

interface FundInfo {
  name: string;
  price: string;
  nav: string;
  supply: string;
  isPaused: boolean;
  fundTokenId: string;
  tokens: {
    identifier: string;
    decimals: number;
    weight: number;
    balance: string;
    apr: string;
    base_token_equivalent: string;
    base_token_decimals: number;
  }[];
  fees: {
    protocol: {
      buy: number;
      withdraw: number;
      performance: number;
    };
    manager: {
      buy: number;
      withdraw: number;
      performance: number;
    };
  };
}

export const useGetLiquidFundInfo = (contractAddress: string) => {
  const [data, setData] = useState<FundInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFundInfo = async () => {
      console.log('Fetching fund info for address:', contractAddress);
      try {
        // Get fund info using getIndexFundInfo endpoint
        const response = await queryContract(
          'getIndexFundInfo',
          [],
          ['tuple<bytes,bytes,bytes,u64,bytes,bytes,bytes,bool,bool,variadic<tuple<bytes,u32,u32,bytes,bytes,bytes,u32>>,tuple<u64,u64,u64,u64,u64,u64>>'],
          liquidFundAbi,
          contractAddress
        );

        if (!response || !response.returnData || !response.returnData[0]) {
          throw new Error('Invalid response from getIndexFundInfo');
        }

        // Get price separately since it's not included in getIndexFundInfo
        const priceResponse = await queryContract(
          'getIndexFundPrice',
          [],
          ['BigUint'],
          liquidFundAbi,
          contractAddress
        );

        // Get supply separately
        const supplyResponse = await queryContract(
          'getFundSupply',
          [],
          ['BigUint'],
          liquidFundAbi,
          contractAddress
        );

        const values = response.returnData;
        const processedData = parseFundDetails(values, priceResponse.returnData[0], supplyResponse.returnData[0]);

        console.log('Processed fund info:', processedData);
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

  const parseFundDetails = (values: any, priceValue: any, supplyValue: any): FundInfo => {
    const fundDecimals = Number(values[4].valueOf());
    const rawPrice = Number(BigInt(priceValue.toString())) / Math.pow(10, 6);
    const formattedPrice = rawPrice.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });

    // NAV is the smaller number, Supply is the larger number
    const nav = values[5].toString();        // NAV is at index 5
    const supply = values[6].toString();     // Supply is at index 6

    return {
      name: values[3].toString(),
      price: formattedPrice,
      nav: Number(nav).toString(),    // Return NAV without decimal conversion
      supply: supply,
      isPaused: values[8].valueOf(),
      fundTokenId: values[2].toString(),
      tokens: values[10].valueOf().map((structure: any) => ({
        identifier: structure.token_identifier.toString(),
        decimals: Number(structure.decimals.valueOf()),
        weight: Number(structure.weight.valueOf()) / 100,
        balance: structure.balance.toString(),
        apr: structure.apr.toString(),
        base_token_equivalent: structure.base_token_equivalent.valueOf(),
        base_token_decimals: Number(structure.base_token_decimals.valueOf())
      })),
      fees: {
        protocol: {
          buy: Number(values[9].valueOf()[0]) / 100,
          withdraw: Number(values[9].valueOf()[1]) / 100,
          performance: Number(values[9].valueOf()[2]) / 100
        },
        manager: {
          buy: Number(values[9].valueOf()[3]) / 100,
          withdraw: Number(values[9].valueOf()[4]) / 100,
          performance: Number(values[9].valueOf()[5]) / 100
        }
      }
    };
  };

  return { data, isLoading, error };
}; 