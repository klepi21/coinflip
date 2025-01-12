import { useEffect, useState } from 'react';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { 
  ContractFunction, 
  ResultsParser, 
  SmartContract,
  Address,
  AbiRegistry,
  ReturnCode,
  TypedOutcomeBundle
} from '@multiversx/sdk-core';
import liquidFundAbi from '@/config/valoro_liquid_fund_template_sc.abi.json';

interface TokenInfo {
  identifier: string;
  weight: number;
  balance: string;
  decimals: number;
}

interface FundDetails {
  name: string;
  price: string;
  nav: string;
  supply: string;
  isPaused: boolean;
  fundTokenId: string;
  tokens: TokenInfo[];
  fees: {
    protocol: { buy: number; withdraw: number; performance: number; };
    manager: { buy: number; withdraw: number; performance: number; };
  };
}

interface TokenStructure {
  token_identifier: { toString: () => string };
  decimals: { valueOf: () => number };
  weight: { valueOf: () => number };
  balance: { toString: () => string };
}

// Add type for query response
interface QueryResponse extends TypedOutcomeBundle {
  values: any[];
  returnCode: ReturnCode;
  returnMessage: string;
}

const parseFundDetails = (values: any, priceValue: any, supplyValue: any): FundDetails => {
  const fundDecimals = Number(values[4].valueOf());
  const rawPrice = Number(BigInt(priceValue.toString())) / Math.pow(10, 6);
  const formattedPrice = rawPrice.toLocaleString('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  });

  // NAV is the smaller number, Supply is the larger number
  const nav = values[5].toString();        // NAV is at index 5 (1704946)
  const supply = values[6].toString();     // Supply is at index 6 (1964011584532620276)

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
      readableBalance: Number(structure.balance.toString()) / Math.pow(10, Number(structure.decimals.valueOf()))
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

export const useGetLiquidFundDetails = (address: string) => {
  const [details, setDetails] = useState<FundDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);

        const provider = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com');
        const abiRegistry = AbiRegistry.create(liquidFundAbi);
        const contract = new SmartContract({
          address: new Address(address),
          abi: abiRegistry
        });

        // Get fund info
        const fundInfoQuery = contract.createQuery({
          func: new ContractFunction('getIndexFundInfo'),
          args: []
        });

        // Get price
        const priceQuery = contract.createQuery({
          func: new ContractFunction('getIndexFundPrice'),
          args: []
        });

        // Get supply
        const supplyQuery = contract.createQuery({
          func: new ContractFunction('getFundSupply'),
          args: []
        });

        // Execute all queries
        const [fundInfoResponse, priceResponse, supplyResponse] = await Promise.all([
          provider.queryContract(fundInfoQuery),
          provider.queryContract(priceQuery),
          provider.queryContract(supplyQuery)
        ]);

        const resultsParser = new ResultsParser();

        // Parse fund info
        const { values } = resultsParser.parseQueryResponse(
          fundInfoResponse, 
          contract.getEndpoint('getIndexFundInfo')
        );

        // Log each field individually
        console.log('Fund Info Fields:');
        console.log('----------------------------------------');
        console.log('Manager Address:', values[0].toString());
        console.log('Fund Token ID:', values[2].toString());
        console.log('USDC Token ID:', values[1].toString());
        console.log('Fund Name:', values[3].toString());
        console.log('Fund Decimals:', Number(values[4].valueOf().c[0]));
        console.log('NAV:', values[5].toString());
        console.log('Supply:', values[6].toString());
        console.log('Is Initialized:', values[7].valueOf());
        console.log('Is Paused:', values[8].valueOf());
        console.log('Fees:', {
          protocol: {
            buy: values[9].valueOf()[0],
            withdraw: values[9].valueOf()[1],
            performance: values[9].valueOf()[2]
          },
          manager: {
            buy: values[9].valueOf()[3],
            withdraw: values[9].valueOf()[4],
            performance: values[9].valueOf()[5]
          }
        });
        console.log('Token Structures:', values[10].valueOf().map((t: TokenStructure) => ({
          identifier: t.token_identifier.toString(),
          decimals: t.decimals.valueOf(),
          weight: t.weight.valueOf(),
          balance: t.balance.toString()
        })));
        console.log('----------------------------------------');

        // Get fund decimals from the response
        const fundDecimals = Number(values[4].valueOf());

        // Parse price
        const priceValue = resultsParser.parseQueryResponse(
          priceResponse,
          contract.getEndpoint('getIndexFundPrice')
        ).values[0];

        // Parse supply
        const supplyValue = resultsParser.parseQueryResponse(
          supplyResponse,
          contract.getEndpoint('getFundSupply')
        ).values[0];

        const parsedDetails = parseFundDetails(values, priceValue, supplyValue);
        setDetails(parsedDetails);

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch fund details'));
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchDetails();
    }
  }, [address]);

  return { details, isLoading, error };
}; 