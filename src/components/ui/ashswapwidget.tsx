import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useGetAccount, useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { getNetworkConfig } from '@multiversx/sdk-dapp/utils';
import axios from 'axios';
import { Address, BooleanValue, ContractFunction, Interaction, SmartContract, TokenTransfer } from '@multiversx/sdk-core/out';
import { Aggregator } from '@ashswap/ash-sdk-js/out';
import { ChainId } from '@ashswap/ash-sdk-js/out/helper/token';
import BigNumber from 'bignumber.js';
import { useToast } from './toast';
import { useTrackTransactionStatus } from '@multiversx/sdk-dapp/hooks/transactions/useTrackTransactionStatus';

// Constants
const QX_ASHSWAP_AGGREGATOR_SC = 'erd1qqqqqqqqqqqqqpgqfpxvzz7s3ws2at75g8lz92r4z5r24gl4u7zsz63spm';

const FEE = 0.001; // 0.1%
const EGLD_MINIMUM_VALUE = 0.005;

// Allowed tokens for "You receive" section
const ALLOWED_RECEIVE_TOKENS = ['RARE', 'BOD', 'KWAK', 'ONE', 'TOM', 'JEX'];

// Types
interface Token {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  balance?: string;
  icon?: string;
}

// Add this interface for MultiversX API token response
interface MxToken {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  price: number;
  assets?: {
    website?: string;
    description?: string;
    status?: string;
    pngUrl?: string;
    svgUrl?: string;
  };
}

// Update the QuoteResponse interface to match the actual API response
interface QuoteResponse {
  swapAmount: string;
  returnAmount: string;
  swapAmountWithDecimal: string;
  returnAmountWithDecimal: string;
  tokenIn: string;
  tokenOut: string;
  marketSp: string;
  effectivePrice: number;
  priceImpact: number;
  swaps: Array<{
    poolId: string;
    assetInIndex: number;
    assetOutIndex: number;
    amount: string;
    returnAmount: string;
    assetIn: string;
    assetOut: string;
    functionName: string;
    arguments: string[];
  }>;
  routes: Array<{
    hops: Array<{
      poolId: string;
      tokenIn: string;
      tokenInAmount: string;
      tokenOut: string;
      tokenOutAmount: string;
    }>;
  }>;
  warning?: string;
}

// Default tokens
const DEFAULT_TOKENS: Token[] = [
  {
    identifier: 'USDC-c76f1f',
    name: 'USD Coin',
    ticker: 'USDC',
    decimals: 6,
    icon: 'https://media.elrond.com/tokens/asset/USDC-c76f1f/logo.svg'
  },
  {
    identifier: 'RARE-99e8b0',
    name: 'RARE Token',
    ticker: 'RARE',
    decimals: 18,
    icon: 'https://media.elrond.com/tokens/asset/RARE-99e8b0/logo.svg'
  }
];

const QX_CONSTANTS = {
  API_URL: 'https://aggregator.ashswap.io',
  ROUTER_ADDRESS: 'erd1qqqqqqqqqqqqqpgqfpxvzz7s3ws2at75g8lz92r4z5r24gl4u7zsz63spm',
  AGGREGATOR_SC_ADDRESS: 'erd1qqqqqqqqqqqqqpgqfpxvzz7s3ws2at75g8lz92r4z5r24gl4u7zsz63spm',
  DEFAULT_SLIPPAGE: 0.5,
  GAS_LIMIT: 60_000_000,
  CHAIN_ID: '1',
  ENDPOINTS: {
    QUOTE: '/aggregate',
    BUILD_TX: '/build-tx'
  }
};

// Add QuoteInfo type
interface QuoteInfo {
  effectivePrice: number;
  priceImpact: number;
  warning?: string;
}

// Constants
const GOLD_COLOR = '#FFB930'; // App's gold color

// UI Components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, className = '', children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full px-4 py-3 rounded-lg font-semibold
      ${disabled 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}
      transition-colors ${className}
    `}
  >
    {children}
  </button>
);

const Input: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 rounded-lg
      bg-gray-50 dark:bg-gray-700
      border border-gray-200 dark:border-gray-600
      focus:outline-none focus:ring-2 focus:ring-blue-500
      ${className}
    `}
  />
);

const TokenSelector: React.FC<{
  value: Token | null;
  onChange: (token: Token) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tokens when modal opens
  useEffect(() => {
    const fetchTokens = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get<MxToken[]>('https://api.multiversx.com/tokens');
        
        // Filter for valid tokens, less restrictive conditions
        const validTokens = response.data
          .filter(token => 
            token.assets && // Just check if assets exist
            token.ticker !== 'WEGLD-bd4d79' && // Filter out WEGLD since we have EGLD
            token.decimals !== undefined // Make sure decimals are defined
          )
          .map(token => ({
            identifier: token.identifier,
            name: token.name,
            ticker: token.ticker,
            decimals: token.decimals,
            icon: token.assets?.svgUrl || token.assets?.pngUrl || `https://media.elrond.com/tokens/asset/${token.identifier}/logo.svg`
          }));

        // Add EGLD at the top
        setTokens([
          {
            identifier: 'EGLD',
            name: 'MultiversX eGold',
            ticker: 'EGLD',
            decimals: 18,
            icon: 'https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg'
          },
          ...validTokens
        ]);

        console.log('Fetched tokens:', validTokens.length); // Debug log
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [isOpen]);

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(search.toLowerCase()) ||
    token.ticker.toLowerCase().includes(search.toLowerCase()) ||
    token.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
      >
        {value ? (
          <div className="flex items-center gap-2">
            <img src={value.icon} alt={value.name} className="w-6 h-6 rounded-full" />
            <span className="text-white">{value.ticker}</span>
          </div>
        ) : (
          <span className="text-gray-400">Select {label}</span>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#0D111C] rounded-[24px] w-[420px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[#1B2131]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-white">Select a token</h3>
                <button onClick={() => setIsOpen(false)} className="text-[#5D6785] hover:text-white">✕</button>
              </div>
              <input
                type="text"
                placeholder="Search name or paste address"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#131A2A] text-white p-4 rounded-[20px] outline-none"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-[#5D6785]">Loading tokens...</div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-4 text-[#5D6785]">No tokens found</div>
              ) : (
                filteredTokens.map(token => (
                  <button
                    key={token.identifier}
                    onClick={() => {
                      onChange(token);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-4 p-4 hover:bg-[#131A2A] transition-colors
                      ${value?.identifier === token.identifier ? 'bg-[#131A2A]' : ''}
                    `}
                  >
                    <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />
                    <div className="text-left">
                      <div className="text-white font-medium">{token.ticker}</div>
                      <div className="text-sm text-[#5D6785]">{token.name}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SwapCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#0D111C] rounded-[24px] w-[464px] p-4 shadow-lg border border-[#1B2131]">
    {children}
  </div>
);

const SwapHeader: React.FC = () => (
  <div className="flex items-center justify-between mb-3 px-2">
    <h2 className="text-[18px] font-medium text-white">Swap</h2>
    <button className="p-2 hover:bg-[#1B2131] rounded-xl transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#5D6785]">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    </button>
  </div>
);

const adjustAmountWithDecimals = (amount: string, decimals: number): string => {
  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return '0';
    return (parsedAmount * Math.pow(10, decimals)).toString();
  } catch {
    return '0';
  }
};

const SwapInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  token: Token | null;
  onSelectToken: () => void;
  label?: string;
  isOutput?: boolean;
}> = ({ value, onChange, token, onSelectToken, label, isOutput }) => {
  const { address } = useGetAccountInfo();
  const [balance, setBalance] = useState<string>('0');

  // Fetch token balance when token changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!token || !address) return;

      try {
        if (token.identifier === 'EGLD') {
          const response = await axios.get(`https://api.multiversx.com/accounts/${address}/balance`);
          const balanceInEGLD = new BigNumber(response.data).dividedBy(10 ** 18).toString();
          setBalance(balanceInEGLD);
        } else {
          const response = await axios.get(`https://api.multiversx.com/accounts/${address}/tokens/${token.identifier}`);
          const balanceInToken = new BigNumber(response.data.balance).dividedBy(10 ** token.decimals).toString();
          setBalance(balanceInToken);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error); 
        setBalance('0');
      }
    };

    fetchBalance();
  }, [token, address]);

  const displayValue = isOutput && token && value ? 
    (parseFloat(value) / Math.pow(10, token.decimals)).toString() :
    value;

  const formattedBalance = parseFloat(balance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-[20px] border-2 border-[#FFB930]/30">
      <div className="flex justify-between items-center mb-2">
        <div className="text-base font-bold text-[#FFB930]">{label}</div>
        {token && !isOutput && (
          <div className="text-sm text-[#FFB930]/70">
            Balance: {formattedBalance} {token.ticker}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-2">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          readOnly={isOutput}
          className="bg-transparent text-3xl font-bold text-white outline-none flex-1 w-full placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={onSelectToken}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] py-2 px-4 rounded-full transition-colors border-2 border-[#FFB930]/40"
        >
          {token ? (
            <>
              <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
              <span className="text-[#FFB930] font-bold text-lg">{token.ticker}</span>
              <span className="text-[#FFB930] font-bold">▼</span>
            </>
          ) : (
            <span className="text-[#FFB930] font-bold text-lg">Select token ▼</span>
          )}
        </button>
      </div>
    </div>
  );
};

const SwapArrow: React.FC = () => (
  <div className="flex justify-center -my-2 z-10">
    <div
      className="bg-[#1a1a1a] p-3 rounded-xl border-2 border-[#FFB930]/10 opacity-50 cursor-not-allowed"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#FFB930]/50">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 13L17 13M17 13L13 17M17 13L13 9" />
      </svg>
    </div>
  </div>
);

// Add this helper function to encode arguments to base64
const encodeToBase64 = (str: string) => {
  return Buffer.from(str).toString('base64');
};

// Add helper function for decimal conversion
const toBaseUnit = (amount: string, decimals: number): string => {
  const parts = amount.split('.');
  const wholePart = parts[0];
  const decimalPart = parts[1] || '';
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  return `${wholePart}${paddedDecimal}`;
};

// Add resolveWarning function
const resolveWarning = async (warning: string): Promise<boolean> => {
  console.log('Swap warning:', warning);
  // For now, we'll accept all warnings. In production, you might want to show a confirmation dialog
  return true;
};

// Helper functions
const getAggregationData = async (aggregatorService: Aggregator, firstTokenIdentifier: string, secondTokenIdentifier: string, amount: string, slippage = 200) => {
  const tokens = await aggregatorService.getTokens();

  const { sorResponse, getInteraction } = await aggregatorService
    .aggregate(firstTokenIdentifier, secondTokenIdentifier, amount, slippage);

  // @ts-ignore Probably mismatch between AshSwap and MvX Interaction
  const interaction: Interaction | null = await getInteraction(async () => true)
    .catch(() => null);

  return { data: sorResponse, interaction, tokens };
};

function prepareFinalInteraction(interaction: Interaction, address: string, amount: string) {
  const { chainId } = getNetworkConfig();

  const finalArgs = interaction.getArguments();

  // Adjust for expected arguments length
  const expectedArgsLength = 3;
  if (finalArgs.length === expectedArgsLength) {
    // Insert a new BooleanValue before the last argument
    finalArgs.splice(finalArgs.length - 1, 0, new BooleanValue(false));
  }

  const contract = new SmartContract({ address: new Address(QX_ASHSWAP_AGGREGATOR_SC) });
  let finalInteraction = new Interaction(contract, new ContractFunction('swap'), finalArgs)
    .withSender(new Address(address))
    .withChainID(chainId)
    .withGasLimit(interaction.getGasLimit().valueOf());

  if (new BigNumber(interaction.getValue().toString()).toNumber() > 0) {
    finalInteraction = finalInteraction.withValue(amount);
  } else {
    const transfers = interaction.getTokenTransfers();
    if (!transfers || transfers.length === 0) {
      throw new Error('No token transfers found.');
    }
    const [transfer] = transfers;
    finalInteraction = finalInteraction.withSingleESDTTransfer(
      TokenTransfer.fungibleFromBigInteger(transfer.tokenIdentifier, amount)
    );
  }

  return finalInteraction;
}

// Update the component props
interface AshSwapWidgetProps {
  availableTokens: Token[];
  isLoadingTokens: boolean;
}

export const AshSwapWidget: React.FC<AshSwapWidgetProps> = ({ availableTokens, isLoadingTokens }) => {
  const { address } = useGetAccount();
  const { chainId } = getNetworkConfig();
  const { toast, ToastContainer } = useToast();
  
  // Find USDC and RARE tokens from available tokens
  const defaultUSDC = availableTokens.find(t => t.identifier === 'USDC-c76f1f');
  const defaultRARE = availableTokens.find(t => t.identifier === 'RARE-99e8b0');
  
  // Initialize with default tokens if found, otherwise use first available tokens
  const [tokenIn, setTokenIn] = useState<Token | null>(defaultUSDC || null);
  const [tokenOut, setTokenOut] = useState<Token | null>(defaultRARE || null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenInModalOpen, setIsTokenInModalOpen] = useState(false);
  const [isTokenOutModalOpen, setIsTokenOutModalOpen] = useState(false);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [outAmount, setOutAmount] = useState('');
  const [quoteInfo, setQuoteInfo] = useState<QuoteInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Add transaction tracking
  const { isPending, isSuccessful, isFailed } = useTrackTransactionStatus({
    transactionId: sessionId || ''
  });

  const aggregatorService = useMemo(() => 
    new Aggregator({ 
      chainId: ChainId.Mainnet
    }), 
    []
  );

  // Update the quote fetching effect
  useEffect(() => {
    const getQuote = async () => {
      if (!tokenIn?.identifier || !tokenOut?.identifier || !amount || !address) return;

      try {
        setIsLoading(true);
        const swapAmount = new BigNumber(amount)
          .multipliedBy(1 - FEE)
          .multipliedBy(Math.pow(10, tokenIn.decimals))
          .toFixed(0);

        const { data, interaction: newInteraction } = await getAggregationData(
          aggregatorService,
          tokenIn.identifier === 'EGLD' ? 'WEGLD-bd4d79' : tokenIn.identifier,
          tokenOut.identifier === 'EGLD' ? 'WEGLD-bd4d79' : tokenOut.identifier,
          swapAmount
        );

        setInteraction(newInteraction);
        setQuoteInfo({
          effectivePrice: data.effectivePrice,
          priceImpact: data.priceImpact,
          warning: data.warning
        });
        setOutAmount(data.returnAmount ? 
          new BigNumber(data.returnAmount)
            .multipliedBy(Math.pow(10, tokenOut.decimals))
            .toString() : 
          '0'
        );
        setError(null);
      } catch (err) {
        setError('Failed to get quote');
        console.error('Quote error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getQuote();
  }, [tokenIn, tokenOut, amount, address, aggregatorService]);

  // Show transaction status toasts
  useEffect(() => {
    if (!sessionId) return;

    if (isPending) {
      toast({
        title: "Transaction Pending",
        description: "Your swap transaction is being processed...",
        duration: 1000000, // Very long duration instead of null
      });
    }

    if (isSuccessful) {
      toast({
        title: "Transaction Successful",
        description: "Your swap has been completed successfully!",
        duration: 5000,
      });
      // Reset states after success
      setSessionId(null);
      setAmount('');
      setOutAmount('');
    }

    if (isFailed) {
      toast({
        title: "Transaction Failed",
        description: "Your swap transaction has failed. Please try again.",
        duration: 5000,
        variant: "destructive",
      });
      setSessionId(null);
    }
  }, [isPending, isSuccessful, isFailed, sessionId, toast]);

  // Update the swap handler with toast notifications
  const handleSwap = useCallback(async () => {
    if (!interaction || !address || !tokenIn || !tokenOut || !amount) return;

    try {
      const actualAmount = new BigNumber(amount)
        .multipliedBy(Math.pow(10, tokenIn.decimals))
        .toFixed(0);

      const finalInteraction = prepareFinalInteraction(interaction, address, actualAmount);

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [finalInteraction.buildTransaction()],
        transactionsDisplayInfo: {
          processingMessage: 'Processing Swap',
          errorMessage: 'Swap failed',
          successMessage: 'Swap successful'
        },
        redirectAfterSign: false,
        callbackRoute: window.location.pathname
      });

      setSessionId(newSessionId);
      setError(null);

    } catch (err) {
      console.error('Swap error:', err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : 'Failed to prepare swap',
        duration: 5000,
        variant: "destructive",
      });
      setError(err instanceof Error ? err.message : 'Failed to prepare swap');
    }
  }, [interaction, address, tokenIn, tokenOut, amount, toast]);

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-[24px] p-6 border-2 border-[#FFB930]/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#FFB930]">Swap</h2>
          <div className="text-[#FFB930]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <SwapInput
            value={amount}
            onChange={setAmount}
            token={tokenIn}
            onSelectToken={() => setIsTokenInModalOpen(true)}
            label="You pay"
          />

          <SwapArrow />

          <SwapInput
            value={outAmount}
            onChange={() => {}}
            token={tokenOut}
            onSelectToken={() => setIsTokenOutModalOpen(true)}
            label="You receive"
            isOutput
          />

          {interaction && quoteInfo && (
            <div className="px-4 py-3 text-base bg-[#1a1a1a] rounded-lg mt-4 border-2 border-[#FFB930]/30">
              <div className="flex justify-between text-[#FFB930] font-bold">
                <span>Rate</span>
                <span>1 {tokenIn?.ticker} = {(1/quoteInfo.effectivePrice).toFixed(6)} {tokenOut?.ticker}</span>
              </div>
              <div className="flex justify-between text-[#FFB930] font-bold">
                <span>Price Impact</span>
                <span className={`${quoteInfo.priceImpact > 0.01 ? 'text-red-500' : 'text-[#FFB930]'}`}>
                  {(quoteInfo.priceImpact * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={isLoading || !interaction || !address}
            className={`
              w-full py-4 rounded-[20px] mt-4 font-bold text-xl
              ${!address ? 'bg-[#FFB930] hover:bg-[#FFB930]/90 text-black' :
                isLoading || !interaction ? 'bg-[#2a2a2a] text-[#9ca3af] cursor-not-allowed border-2 border-[#FFB930]/30' :
                'bg-[#FFB930] hover:bg-[#FFB930]/90 text-black'}
              transition-colors border-2 border-[#FFB930]/30
            `}
          >
            {!address ? 'Connect Wallet' : 
             isLoading ? 'Processing...' : 
             !interaction ? 'Enter an amount' :
             'Swap'}
          </button>

          {error && (
            <div className="text-red-500 text-center mt-2 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Token Selection Modal */}
        <TokenSelectorModal
          isOpen={isTokenInModalOpen}
          onClose={() => setIsTokenInModalOpen(false)}
          onSelect={setTokenIn}
          selectedToken={tokenIn}
          filterTokens={false}
          tokens={availableTokens}
          isLoading={isLoadingTokens}
        />
        <TokenSelectorModal
          isOpen={isTokenOutModalOpen}
          onClose={() => setIsTokenOutModalOpen(false)}
          onSelect={setTokenOut}
          selectedToken={tokenOut}
          filterTokens={true}
          allowedTokens={ALLOWED_RECEIVE_TOKENS}
          tokens={availableTokens}
          isLoading={isLoadingTokens}
        />
      </div>
      <ToastContainer />
    </>
  );
};

// Update TokenSelectorModal styling
const TokenSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken: Token | null;
  filterTokens?: boolean;
  allowedTokens?: string[];
  tokens: Token[];
  isLoading: boolean;
}> = ({ isOpen, onClose, onSelect, selectedToken, filterTokens = false, allowedTokens = [], tokens, isLoading }) => {
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;

  let filteredTokens = [...tokens];
  
  // Filter tokens if needed
  if (filterTokens && allowedTokens.length > 0) {
    filteredTokens = filteredTokens.filter((token: Token) => 
      allowedTokens.includes(token.ticker)
    );
  }

  // Apply search filter
  filteredTokens = filteredTokens.filter((token: Token) =>
    token.name.toLowerCase().includes(search.toLowerCase()) ||
    token.ticker.toLowerCase().includes(search.toLowerCase()) ||
    token.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#1a1a1a] rounded-[24px] w-[400px] max-h-[80vh] overflow-hidden border-2 border-[#FFB930]/30">
        <div className="p-4 border-b border-[#FFB930]/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#FFB930]">Select a token</h3>
            <button onClick={onClose} className="text-[#FFB930] hover:text-[#FFB930]/80">✕</button>
          </div>
          <input
            type="text"
            placeholder="Search name or paste address"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#2a2a2a] text-white p-4 rounded-[20px] outline-none border-2 border-[#FFB930]/30 focus:border-[#FFB930] placeholder-gray-500"
          />
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-[#FFB930]">Loading tokens...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-4 text-[#FFB930]">No tokens found</div>
          ) : (
            filteredTokens.map((token: Token) => (
              <button
                key={token.identifier}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-4 p-4 hover:bg-[#2a2a2a] transition-colors border-b border-[#FFB930]/10
                  ${selectedToken?.identifier === token.identifier ? 'bg-[#2a2a2a]' : ''}
                `}
              >
                <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />
                <div className="text-left">
                  <div className="text-[#FFB930] font-bold text-lg">{token.ticker}</div>
                  <div className="text-sm text-[#FFB930]/70">{token.name}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 