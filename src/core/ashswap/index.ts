import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { AVAILABLE_TOKENS } from '@/components/ui/TokenSelector';

// Types
export interface Token {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  balance?: string;
}

export interface SwapRoute {
  steps: SwapStep[];
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
}

export interface SwapStep {
  poolAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  protocol: string;
}

export interface QxQuoteResponse {
  routes: SwapRoute[];
  bestRoute: SwapRoute;
}

export interface SwapTransaction {
  nonce: number;
  value: string;
  receiver: string;
  sender: string;
  gasPrice: number;
  gasLimit: number;
  data: string;
  chainID: string;
  version: number;
}

// Constants
export const QX_CONSTANTS = {
  API_URL: 'https://aggregator.ashswap.io/aggregate',
  ROUTER_ADDRESS: 'erd1qqqqqqqqqqqqqpgqq66xk9gfr4e4m9r3j4yaz0u6xj4q36f3wmfs9k86q4',
  DEFAULT_SLIPPAGE: 0.5,
  GAS_LIMIT: 60_000_000,
  CHAIN_ID: '1' // mainnet
};

// API Functions
export async function getQuote(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number;
}): Promise<QxQuoteResponse> {
  // Find the input token to get its decimals
  const inputToken = AVAILABLE_TOKENS.find((token: Token) => token.identifier === params.tokenIn);
  if (!inputToken) {
    throw new Error('Input token not found');
  }

  // Convert the amount to the proper decimal places
  const amount = parseAmount(params.amountIn, inputToken.decimals);

  const response = await axios.get(QX_CONSTANTS.API_URL, {
    params: {
      from: params.tokenIn,
      to: params.tokenOut,
      amount: amount
    }
  });
  return {
    routes: response.data.routes,
    bestRoute: {
      steps: response.data.swaps.map((swap: any) => ({
        poolAddress: swap.poolId,
        tokenIn: swap.assetIn,
        tokenOut: swap.assetOut,
        amountIn: swap.amount,
        amountOut: swap.returnAmount,
        protocol: 'ashswap'
      })),
      tokenIn: response.data.tokenIn,
      tokenOut: response.data.tokenOut,
      amountIn: response.data.swapAmountWithDecimal,
      amountOut: response.data.returnAmountWithDecimal,
      priceImpact: response.data.priceImpact || 0
    }
  };
}

export async function buildTransaction(params: {
  route: SwapRoute;
  userAddress: string;
  slippage: number;
}) {
  const response = await axios.post(`${QX_CONSTANTS.API_URL}/build-tx`, params);
  return response.data;
}

// Hooks
export function useSwapQuote(params: {
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  slippage: number;
}) {
  const [quote, setQuote] = useState<QxQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!params.tokenIn || !params.tokenOut || !params.amountIn) {
        setQuote(null);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getQuote({
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          amountIn: params.amountIn,
          slippage: params.slippage
        });
        setQuote(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quote');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [params.tokenIn, params.tokenOut, params.amountIn, params.slippage]);

  return { quote, isLoading, error };
}

export function useSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(async (params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    userAddress: string;
    slippage?: number;
    route: SwapRoute;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const txData = await buildTransaction({
        route: params.route,
        userAddress: params.userAddress,
        slippage: params.slippage || QX_CONSTANTS.DEFAULT_SLIPPAGE
      });

      const { sessionId } = await sendTransactions({
        transactions: txData.transactions,
        transactionsDisplayInfo: {
          processingMessage: 'Processing Swap',
          errorMessage: 'Swap failed',
          successMessage: 'Swap successful'
        }
      });

      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { executeSwap, isLoading, error };
}

// Utility Functions
export function formatAmount(amount: string, decimals: number): string {
  if (!amount) return '0';
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const paddedFractional = fractionalPart.toString().padStart(decimals, '0');
  return `${integerPart}.${paddedFractional}`.replace(/\.?0+$/, '');
}

export function parseAmount(amount: string, decimals: number): string {
  if (!amount || isNaN(Number(amount))) return '0';
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  return (integerPart + paddedFractional).replace(/^0+/, '') || '0';
} 