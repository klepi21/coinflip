import { useEffect, useState, useRef } from 'react';
import { queryContract } from '../utils/contract';
import proxyAbi from '@/config/valoro_proxy_sc.abi.json';
import liquidFundAbi from '@/config/valoro_liquid_fund_template_sc.abi.json';
import { Address } from '@multiversx/sdk-core';

interface LiquidFund {
  address: string;
  name: string;
  tokens: string[];
  supply: string;
  nav: string;
  price: string;
  isPaused: boolean;
}

const PROXY_ADDRESS = 'erd1qqqqqqqqqqqqqpgq0tx8c3v5g4nj4k8a6eaqxxdpexh529ut64qsp5hj2u';

export const useGetLiquidFunds = () => {
  const [funds, setFunds] = useState<LiquidFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchFundDetails = async (address: string) => {
      try {
        const [name, tokens, supply, nav, price, isPaused] = await Promise.all([
          queryContract('getFundName', [], ['bytes'], liquidFundAbi, address),
          queryContract('getFundTokens', [], ['variadic<TokenIdentifier>'], liquidFundAbi, address),
          queryContract('getFundSupply', [], ['BigUint'], liquidFundAbi, address),
          queryContract('getNetAssetsValue', [], ['BigUint'], liquidFundAbi, address),
          queryContract('getIndexFundPrice', [], ['BigUint'], liquidFundAbi, address),
          queryContract('getIsScPaused', [], ['bool'], liquidFundAbi, address),
        ]);

        // Decode base64 values
        const decodeBase64 = (str: string) => {
          try {
            return Buffer.from(str, 'base64').toString('hex');
          } catch (err) {
            console.error('Error decoding base64:', err);
            return '0';
          }
        };

        return {
          address,
          name: name.returnData[0] ? Buffer.from(name.returnData[0], 'base64').toString() : 'Unknown',
          tokens: tokens.returnData.map((token: string) => Buffer.from(token, 'base64').toString()),
          supply: decodeBase64(supply.returnData[0] || ''),
          nav: decodeBase64(nav.returnData[0] || ''),
          price: decodeBase64(price.returnData[0] || ''),
          isPaused: Boolean(isPaused.returnData[0])
        };
      } catch (err) {
        console.error(`Error fetching details for ${address}:`, err);
        return null;
      }
    };

    const fetchFunds = async () => {
      try {
        const response = await queryContract(
          'getIndexFundScs',
          [],
          ['variadic<Address>'],
          proxyAbi,
          PROXY_ADDRESS
        );

        if (response?.returnData && Array.isArray(response.returnData)) {
          const addresses = response.returnData.map((base64Str: string) => {
            const buffer = Buffer.from(base64Str, 'base64');
            const address = new Address(buffer);
            return address.bech32();
          });

          // Fetch details for each fund
          const fundsDetails = await Promise.all(
            addresses.map(address => fetchFundDetails(address))
          );

          // Filter out any null results from failed fetches
          setFunds(fundsDetails.filter((fund): fund is LiquidFund => fund !== null));
        }
      } catch (err: any) {
        console.error('Error fetching funds:', err);
        setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunds();
  }, []);

  return { funds, isLoading, error };
}; 