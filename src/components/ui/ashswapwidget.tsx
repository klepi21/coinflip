import React, { useState, useCallback, useEffect } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import axios from 'axios';

// Types
interface Token {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  balance?: string;
  icon?: string;
}

// Constants
const QX_CONSTANTS = {
  API_URL: 'https://aggregator.ashswap.io',
  ROUTER_ADDRESS: 'erd1qqqqqqqqqqqqqpgqq66xk9gfr4e4m9r3j4yaz0u6xj4q36f3wmfs9k86q4',
  DEFAULT_SLIPPAGE: 0.5,
  GAS_LIMIT: 60_000_000,
  CHAIN_ID: '1',
  ENDPOINTS: {
    QUOTE: '/aggregate',
    BUILD_TX: '/build-tx',
    TOKENS: 'https://api.multiversx.com/tokens'
  }
};

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
  balance?: string;
}> = ({ value, onChange, label, balance }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get(QX_CONSTANTS.ENDPOINTS.TOKENS);
        setTokens(response.data);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      }
    };
    fetchTokens();
  }, []);

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(search.toLowerCase()) ||
    token.ticker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="
          flex items-center justify-between
          px-4 py-3 rounded-lg cursor-pointer
          bg-gray-50 dark:bg-gray-700
          border border-gray-200 dark:border-gray-600
        "
      >
        {value ? (
          <>
            <div className="flex items-center gap-2">
              {value.icon && <img src={value.icon} alt={value.name} className="w-6 h-6 rounded-full" />}
              <span>{value.ticker}</span>
            </div>
            {balance && <span className="text-sm text-gray-500">{balance}</span>}
          </>
        ) : (
          <span>Select {label}</span>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            className="
              bg-white dark:bg-gray-800 rounded-xl p-4
              w-full max-w-md max-h-[80vh] overflow-auto
            "
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Token</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="
                w-full px-4 py-2 mb-4 rounded-lg
                bg-gray-50 dark:bg-gray-700
                border border-gray-200 dark:border-gray-600
              "
            />

            <div className="space-y-2">
              {filteredTokens.map(token => (
                <div
                  key={token.identifier}
                  onClick={() => {
                    onChange(token);
                    setIsOpen(false);
                  }}
                  className="
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer
                    hover:bg-gray-100 dark:hover:bg-gray-700
                  "
                >
                  {token.icon && <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />}
                  <div>
                    <div className="font-medium">{token.ticker}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export const AshSwapWidget: React.FC = () => {
  const { address } = useGetAccount();
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quote fetching effect
  useEffect(() => {
    const getQuote = async () => {
      if (!tokenIn?.identifier || !tokenOut?.identifier || !amount || !address) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`${QX_CONSTANTS.API_URL}${QX_CONSTANTS.ENDPOINTS.QUOTE}`, {
          params: {
            tokenIn: tokenIn.identifier,
            tokenOut: tokenOut.identifier,
            amountIn: amount,
            slippage: QX_CONSTANTS.DEFAULT_SLIPPAGE
          }
        });
        setQuote(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to get quote');
      } finally {
        setIsLoading(false);
      }
    };

    getQuote();
  }, [tokenIn, tokenOut, amount, address]);

  // Swap handler
  const handleSwap = useCallback(async () => {
    if (!quote?.bestRoute || !address || !tokenIn || !tokenOut) return;

    try {
      setIsLoading(true);
      
      const txData = await axios.post(
        `${QX_CONSTANTS.API_URL}${QX_CONSTANTS.ENDPOINTS.BUILD_TX}`,
        {
          route: quote.bestRoute,
          userAddress: address,
          slippage: QX_CONSTANTS.DEFAULT_SLIPPAGE
        }
      );

      await sendTransactions({
        transactions: txData.data.transactions,
        transactionsDisplayInfo: {
          processingMessage: 'Processing Swap',
          errorMessage: 'Swap failed',
          successMessage: 'Swap successful'
        }
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsLoading(false);
    }
  }, [quote, address, tokenIn, tokenOut]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Swap</h2>

      <div className="space-y-4">
        <div>
          <TokenSelector
            label="From"
            value={tokenIn}
            onChange={setTokenIn}
            balance={tokenIn?.balance}
          />
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="mt-2"
          />
        </div>

        <TokenSelector
          label="To"
          value={tokenOut}
          onChange={setTokenOut}
          balance={tokenOut?.balance}
        />

        {quote && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Rate</span>
              <span>{quote.bestRoute.rate} {tokenOut?.ticker}/{tokenIn?.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span>Price Impact</span>
              <span className="text-green-500">{quote.bestRoute.priceImpact}%</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Received</span>
              <span>{quote.bestRoute.amountOut} {tokenOut?.ticker}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSwap}
          disabled={isLoading || !quote || !address}
        >
          {!address ? 'Connect Wallet' : 
           isLoading ? 'Processing...' : 
           'Swap'}
        </Button>

        {error && (
          <div className="text-red-500 text-center mt-2">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}; 