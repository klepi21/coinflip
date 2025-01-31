import React, { useState, useCallback, useEffect } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import axios from 'axios';
import { Address, Transaction, TokenPayment, SmartContract, ContractFunction, Interaction, TokenTransfer, BigUIntValue, BooleanValue } from '@multiversx/sdk-core';

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

// Constants
const DEFAULT_TOKENS: Token[] = [
  {
    identifier: 'EGLD',
    name: 'MultiversX eGold',
    ticker: 'EGLD',
    decimals: 18,
    icon: 'https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg'
  },
  {
    identifier: 'WEGLD-bd4d79',
    name: 'Wrapped EGLD',
    ticker: 'WEGLD',
    decimals: 18,
    icon: 'https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg'
  },
  {
    identifier: 'USDC-c76f1f',
    name: 'USD Coin',
    ticker: 'USDC',
    decimals: 6,
    icon: 'https://media.elrond.com/tokens/asset/USDC-c76f1f/logo.svg'
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

// Add type for swap arguments
type SwapArg = BigUIntValue | BooleanValue;

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
  const displayValue = isOutput && token && value ? 
    (parseFloat(value) / Math.pow(10, token.decimals)).toString() :
    value;

  return (
    <div className="bg-[#131A2A] p-4 rounded-[20px]">
      {label && <div className="text-sm text-[#5D6785] mb-2">{label}</div>}
      <div className="flex justify-between gap-2">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          readOnly={isOutput}
          className="bg-transparent text-2xl text-white outline-none flex-1 w-full"
        />
        <button
          onClick={onSelectToken}
          className="flex items-center gap-2 bg-[#1B2131] hover:bg-[#2B3A54] py-1 px-3 rounded-full transition-colors"
        >
          {token ? (
            <>
              <img src={token.icon} alt={token.name} className="w-5 h-5 rounded-full" />
              <span className="text-white font-medium">{token.ticker}</span>
              <span className="text-[#5D6785]">▼</span>
            </>
          ) : (
            <span className="text-white font-medium">Select token ▼</span>
          )}
        </button>
      </div>
    </div>
  );
};

const SwapArrow: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="flex justify-center -my-2 z-10">
    <button
      onClick={onClick}
      className="bg-[#131A2A] p-2 rounded-xl border border-[#1B2131] hover:bg-[#1B2131] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#5D6785]">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 13L17 13M17 13L13 17M17 13L13 9" />
      </svg>
    </button>
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

// Main Component
export const AshSwapWidget: React.FC = () => {
  const { address } = useGetAccount();
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenInModalOpen, setIsTokenInModalOpen] = useState(false);
  const [isTokenOutModalOpen, setIsTokenOutModalOpen] = useState(false);

  // Update the quote fetching effect
  useEffect(() => {
    const getQuote = async () => {
      if (!tokenIn?.identifier || !tokenOut?.identifier || !amount || !address) return;

      try {
        setIsLoading(true);
        const from = tokenIn.identifier === 'EGLD' ? 'WEGLD-bd4d79' : tokenIn.identifier;
        const to = tokenOut.identifier === 'EGLD' ? 'WEGLD-bd4d79' : tokenOut.identifier;
        const adjustedAmount = adjustAmountWithDecimals(amount, tokenIn.decimals);

        const response = await axios.get<QuoteResponse>(`${QX_CONSTANTS.API_URL}${QX_CONSTANTS.ENDPOINTS.QUOTE}`, {
          params: {
            from,
            to,
            amount: adjustedAmount
          }
        });

        // Store the entire response data
        setQuote(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to get quote');
        console.error('Quote error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getQuote();
  }, [tokenIn, tokenOut, amount, address]);

  // Update the swap handler
  const handleSwap = useCallback(async () => {
    if (!quote || !address || !tokenIn || !tokenOut || !amount) return;

    try {
      // Get the first swap from the quote
      const swap = quote.swaps[0];
      if (!swap) {
        throw new Error('No swap route available');
      }

      // Format steps data
      let stepsData = '';
      // First, add the number of steps
      stepsData += quote.swaps.length.toString(16).padStart(8, '0');
      
      for (const swap of quote.swaps) {
        // Token in identifier
        const tokenInHex = Buffer.from(swap.assetIn).toString('hex');
        stepsData += tokenInHex.length.toString(16).padStart(8, '0') + tokenInHex;
        
        // Token out identifier
        const tokenOutHex = Buffer.from(swap.assetOut).toString('hex');
        stepsData += tokenOutHex.length.toString(16).padStart(8, '0') + tokenOutHex;
        
        // Amount in
        const amountHex = BigInt(toBaseUnit(swap.amount, tokenIn.decimals)).toString(16).padStart(32, '0');
        stepsData += amountHex;
        
        // Pool address (should be 32 bytes)
        const poolAddressHex = Buffer.from(swap.poolId).toString('hex');
        stepsData += poolAddressHex;
        
        // Function name
        const functionNameHex = Buffer.from(swap.functionName).toString('hex');
        stepsData += functionNameHex.length.toString(16).padStart(8, '0') + functionNameHex;
        
        // Arguments array
        stepsData += swap.arguments.length.toString(16).padStart(8, '0');
        for (const arg of swap.arguments) {
          const argHex = Buffer.from(arg).toString('hex');
          stepsData += argHex.length.toString(16).padStart(8, '0') + argHex;
        }
      }

      // Format limits data
      let limitsData = '';
      // Number of limits
      limitsData += '01'; // One limit
      
      // Token identifier
      const limitTokenHex = Buffer.from(tokenOut.identifier === 'EGLD' ? 'WEGLD-bd4d79' : tokenOut.identifier).toString('hex');
      limitsData += limitTokenHex.length.toString(16).padStart(8, '0') + limitTokenHex;
      
      // Amount limit
      const limitAmountHex = BigInt(toBaseUnit(quote.returnAmount, tokenOut.decimals)).toString(16).padStart(32, '0');
      limitsData += limitAmountHex;

      // Prepare the transaction
      let tx;
      
      if (tokenIn.identifier === 'EGLD') {
        // For EGLD, use direct value transfer
        tx = {
          value: quote.swapAmount,
          data: Buffer.from(`swap@${stepsData}@${limitsData}@${tokenOut.identifier === 'EGLD' ? '01' : '00'}`).toString('base64'),
          receiver: new Address(QX_CONSTANTS.AGGREGATOR_SC_ADDRESS),
          sender: new Address(address),
          gasLimit: QX_CONSTANTS.GAS_LIMIT,
          chainID: QX_CONSTANTS.CHAIN_ID,
          version: 1
        };
      } else {
        // For ESDT tokens, use ESDTTransfer
        const encodedTokenId = Buffer.from(tokenIn.identifier).toString('hex');
        const amountHex = BigInt(toBaseUnit(quote.swapAmount, tokenIn.decimals)).toString(16).padStart(32, '0');
        
        tx = {
          value: '0',
          data: Buffer.from(`ESDTTransfer@${encodedTokenId}@${amountHex}@${Buffer.from('swap').toString('hex')}@${stepsData}@${limitsData}@${tokenOut.identifier === 'EGLD' ? '01' : '00'}`).toString('base64'),
          receiver: new Address(QX_CONSTANTS.AGGREGATOR_SC_ADDRESS),
          sender: new Address(address),
          gasLimit: QX_CONSTANTS.GAS_LIMIT,
          chainID: QX_CONSTANTS.CHAIN_ID,
          version: 1
        };
      }

      // Log the transaction for debugging
      console.log('Final Transaction:', {
        ...tx,
        data: Buffer.from(tx.data, 'base64').toString('utf8'),
        value: tx.value.toString(),
        decodedData: {
          tokenId: tokenIn.identifier,
          amount: quote.swapAmount,
          amountInBaseUnits: toBaseUnit(quote.swapAmount, tokenIn.decimals),
          rawStepsData: stepsData,
          rawLimitsData: limitsData
        }
      });

      // Send the transaction
      const { sessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing Swap',
          errorMessage: 'Swap failed',
          successMessage: 'Swap successful'
        },
        redirectAfterSign: false
      });

      console.log('Transaction sent with sessionId:', sessionId);
      setError(null);
      setAmount('');
      setQuote(null);

    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare swap');
    }
  }, [quote, address, tokenIn, tokenOut, amount]);

  const handleSwapDirection = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmount('');
    setQuote(null);
  };

  return (
    <SwapCard>
      <SwapHeader />
      
      <div className="space-y-1">
        <SwapInput
          value={amount}
          onChange={setAmount}
          token={tokenIn}
          onSelectToken={() => setIsTokenInModalOpen(true)}
          label="You pay"
        />

        <SwapArrow onClick={handleSwapDirection} />

        <SwapInput
          value={quote ? (parseFloat(quote.returnAmount) || '').toString() : ''}
          onChange={() => {}}
          token={tokenOut}
          onSelectToken={() => setIsTokenOutModalOpen(true)}
          label="You receive"
          isOutput
        />

        {quote && (
          <div className="px-4 py-2 text-sm">
            <div className="flex justify-between text-[#5D6785]">
              <span>Rate</span>
              <span>1 {tokenIn?.ticker} = {(1/quote.effectivePrice).toFixed(6)} {tokenOut?.ticker}</span>
            </div>
            <div className="flex justify-between text-[#5D6785]">
              <span>Price Impact</span>
              <span className={`${quote.priceImpact > 0.01 ? 'text-[#FD4040]' : 'text-[#3DBA4C]'}`}>
                {(quote.priceImpact * 100).toFixed(2)}%
              </span>
            </div>
            {quote.warning && quote.warning !== "None" && (
              <div className="text-[#FFA500] mt-1">
                Warning: {quote.warning}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={isLoading || !quote || !address}
          className={`
            w-full py-4 rounded-[20px] mt-2 font-medium text-lg
            ${!address ? 'bg-[#4C82FB] hover:bg-[#5B8EFF]' :
              isLoading || !quote ? 'bg-[#1B2131] text-[#5D6785] cursor-not-allowed' :
              'bg-[#4C82FB] hover:bg-[#5B8EFF]'}
            transition-colors text-white
          `}
        >
          {!address ? 'Connect Wallet' : 
           isLoading ? 'Processing...' : 
           !quote ? 'Enter an amount' :
           'Swap'}
        </button>

        {error && (
          <div className="text-[#FD4040] text-center mt-2 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Token Selection Modals */}
      <TokenSelectorModal
        isOpen={isTokenInModalOpen}
        onClose={() => setIsTokenInModalOpen(false)}
        onSelect={setTokenIn}
        selectedToken={tokenIn}
      />
      <TokenSelectorModal
        isOpen={isTokenOutModalOpen}
        onClose={() => setIsTokenOutModalOpen(false)}
        onSelect={setTokenOut}
        selectedToken={tokenOut}
      />
    </SwapCard>
  );
};

// Updated Token Selector Modal with Uniswap style
const TokenSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken: Token | null;
}> = ({ isOpen, onClose, onSelect, selectedToken }) => {
  const [search, setSearch] = useState('');
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tokens when modal opens
  useEffect(() => {
    const fetchTokens = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get<MxToken[]>('https://api.multiversx.com/tokens?size=500');
        
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

  if (!isOpen) return null;

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(search.toLowerCase()) ||
    token.ticker.toLowerCase().includes(search.toLowerCase()) ||
    token.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#0D111C] rounded-[24px] w-[420px] max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-[#1B2131]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-white">Select a token</h3>
            <button onClick={onClose} className="text-[#5D6785] hover:text-white">✕</button>
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
                  onSelect(token);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-4 p-4 hover:bg-[#131A2A] transition-colors
                  ${selectedToken?.identifier === token.identifier ? 'bg-[#131A2A]' : ''}
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
  );
}; 