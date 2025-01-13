'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { TokenTransfer, Address } from "@multiversx/sdk-core";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from 'sonner';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { TransactionToast } from '../ui/TransactionToast';
import { useRouter } from 'next/navigation';
import { 
  useGetActiveTransactionsStatus, 
  useGetPendingTransactions 
} from '@multiversx/sdk-dapp/hooks/transactions';

interface SharesExchangeFormProps {
  sharePrice: string;
  fundAddress: string;
  fundTokenId: string;
  buyFee: number;
  sellFee: number;
}

const USDC_IDENTIFIER = 'USDC-350c4e';
const USDC_DECIMALS = 6;

type PaymentToken = {
  id: 'USDC-350c4e' | 'EGLD';
  name: string;
  decimals: number;
};

const PAYMENT_TOKENS: PaymentToken[] = [
  { id: 'USDC-350c4e', name: 'USDC', decimals: 6 },
  { id: 'EGLD', name: 'EGLD', decimals: 18 }
];

// Helper function to ensure even hex length
const toEvenHex = (value: bigint) => {
  const hex = value.toString(16);
  return hex.length % 2 === 0 ? hex : `0${hex}`;
};

// Define TransactionStatus without null
type TransactionStatus = {
  status: 'success' | 'error' | 'pending';
  message: string;
  hash?: string;
};

const TX_STATUS_KEY = 'valoro_tx_status';

const saveTransactionStatus = (status: TransactionStatus) => {
  localStorage.setItem(TX_STATUS_KEY, JSON.stringify(status));
};

const getStoredTransactionStatus = (): TransactionStatus | null => {
  const stored = localStorage.getItem(TX_STATUS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const clearTransactionStatus = () => {
  localStorage.removeItem(TX_STATUS_KEY);
};

// Add this function to check transaction status
const checkTransactionStatus = async (hash: string) => {
  try {
    const response = await fetch(`https://devnet-api.multiversx.com/transactions/${hash}`);
    const data = await response.json();
    
    // Log the response to debug
    console.log('Transaction status response:', data);
    
    // Check specific status values from the API
    if (data.status === 'success' || data.status === 'executed' || data.status === 'completed') {
      return 'success';
    } else if (data.status === 'pending' || data.status === 'received') {
      return 'pending';
    } else if (data.status === 'invalid' || data.status === 'failed' || data.status === 'fail') {
      return 'fail';
    }
    return data.status;
  } catch (error) {
    console.error('Error checking transaction:', error);
    return null;
  }
};

export const SharesExchangeForm = ({ 
  sharePrice, 
  fundAddress, 
  fundTokenId,
  buyFee,
  sellFee 
}: SharesExchangeFormProps) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoggedIn, address } = useWallet();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fundTokenBalance, setFundTokenBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [usdcTokenIcon, setUsdcTokenIcon] = useState<string | null>(null);
  const [fundTokenIcon, setFundTokenIcon] = useState<string | null>(null);
  const [selectedPaymentToken, setSelectedPaymentToken] = useState(PAYMENT_TOKENS[0]);
  const [egldTokenIcon, setEgldTokenIcon] = useState<string | null>(null);
  const [egldBalance, setEgldBalance] = useState('0');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [egldPrice, setEgldPrice] = useState<number>(0);

  const searchParams = useSearchParams();

  const { pending, success, fail } = useGetActiveTransactionsStatus();
  const pendingTransactions = useGetPendingTransactions();

  // Handle transaction status on redirect
  useEffect(() => {
    const status = searchParams.get('status');
    const txHash = searchParams.get('txHash');
    const storedStatus = getStoredTransactionStatus();
    
    // If we have a hash from URL params
    if (txHash) {
      const newStatus: TransactionStatus = {
        status: status === 'success' ? 'success' : status === 'failed' ? 'error' : 'pending',
        message: status === 'success' 
          ? 'Transaction completed successfully!' 
          : status === 'failed'
          ? 'Transaction failed. Please try again.'
          : 'Transaction in progress...',
        hash: txHash
      };
      setTransactionStatus(newStatus);
      
      // Only clear storage if transaction is complete
      if (status === 'success' || status === 'failed') {
        clearTransactionStatus();
      }
    } 
    // If no URL params but we have stored status
    else if (storedStatus) {
      setTransactionStatus(storedStatus);
    }
  }, [searchParams]);

  // Fetch user's balance only
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;
      //console.log('Fetching balances for:', { address, fundTokenId });

      try {
        // Fetch EGLD balance using SDK
        const proxy = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com');
        const account = await proxy.getAccount(new Address(address));
        const egldBalance = account.balance.toString();
        //console.log('EGLD balance:', egldBalance); // Debug log
        setEgldBalance((Number(egldBalance) / Math.pow(10, 18)).toFixed(4));

        // Fetch USDC balance and icon
        const usdcResponse = await fetch(
          `https://devnet-api.multiversx.com/accounts/${address}/tokens/${USDC_IDENTIFIER}`
        );
        const usdcData = await usdcResponse.json();
        setUsdcBalance((Number(usdcData.balance) / Math.pow(10, usdcData.decimals)).toString());
        if (usdcData.assets?.pngUrl) {
          setUsdcTokenIcon(usdcData.assets.pngUrl);
        }

        // Fetch fund token balance and icon
        const fundTokenResponse = await fetch(
          `https://devnet-api.multiversx.com/accounts/${address}/tokens/${fundTokenId}`
        );
        const fundTokenData = await fundTokenResponse.json();
        if (fundTokenData.balance) {
          setFundTokenBalance((Number(fundTokenData.balance) / Math.pow(10, fundTokenData.decimals)).toString());
        }
        if (fundTokenData.assets?.pngUrl) {
          setFundTokenIcon(fundTokenData.assets.pngUrl);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
  }, [address, fundTokenId]);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        // Fetch USDC token data
        const usdcResponse = await fetch(
          `https://devnet-api.multiversx.com/tokens/${PAYMENT_TOKENS[0].id}`
        );
        const usdcData = await usdcResponse.json();
        if (usdcData.assets?.pngUrl) {
          setUsdcTokenIcon(usdcData.assets.pngUrl);
        }

        // Set EGLD icon directly from cryptologos
        setEgldTokenIcon('https://cryptologos.cc/logos/multiversx-egld-egld-logo.png');

        // Fetch fund token data
        const fundTokenResponse = await fetch(
          `https://devnet-api.multiversx.com/tokens/${fundTokenId}`
        );
        const fundTokenData = await fundTokenResponse.json();
        if (fundTokenData.assets?.pngUrl) {
          setFundTokenIcon(fundTokenData.assets.pngUrl);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    };

    fetchTokenData();
  }, [fundTokenId]);

  useEffect(() => {
    const fetchEgldPrice = async () => {
      try {
        const response = await fetch('https://api.multiversx.com/economics');
        const data = await response.json();
        setEgldPrice(data.price);
      } catch (error) {
        console.error('Error fetching EGLD price:', error);
      }
    };
    fetchEgldPrice();
  }, []);

  const calculateShares = () => {
    if (!amount || amount === '0') return '0';
    const inputAmount = Number(amount);
    
    if (activeTab === 'buy') {
      if (selectedPaymentToken.id === 'EGLD') {
        const usdValue = inputAmount * egldPrice;
        return (usdValue / Number(sharePrice)).toFixed(4);
      }
      return (inputAmount / Number(sharePrice)).toFixed(4);
    }
    return (inputAmount * Number(sharePrice)).toFixed(6);
  };

  const handleBuy = async () => {
    if (!amount || Number(amount) <= 0) return;
    
    try {
      setIsSubmitting(true);

      // Prepare transaction
      const paymentTokenId = selectedPaymentToken.id;
      const paymentAmount = BigInt(Math.floor(Number(amount) * Math.pow(10, selectedPaymentToken.decimals)));
      const buyFunctionName = Buffer.from('buy').toString('hex');

      // Build the transaction
      const tx = {
        value: selectedPaymentToken.id === 'EGLD' ? paymentAmount.toString() : '0',
        data: selectedPaymentToken.id === 'EGLD' 
          ? `buy`
          : `ESDTTransfer@${Buffer.from(paymentTokenId).toString('hex')}@${toEvenHex(paymentAmount)}@${buyFunctionName}`,
        receiver: fundAddress,
        gasLimit: 500000000,
      };

      // Save initial status before sending transaction
      const initialStatus: TransactionStatus = {
        status: 'pending',
        message: 'Please sign the transaction...'
      };
      setTransactionStatus(initialStatus);
      saveTransactionStatus(initialStatus);

      const { sessionId: newSessionId, hash } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing buy shares transaction',
          errorMessage: 'An error occurred during the buy shares transaction',
          successMessage: 'Buy shares transaction successful'
        },
        redirectAfterSign: true
      });

      // Update status with hash if available
      if (newSessionId) {
        setSessionId(newSessionId);
        const pendingStatus: TransactionStatus = {
          status: 'pending',
          message: 'Transaction in progress...',
          hash: hash // MultiversX SDK might provide hash directly
        };
        setTransactionStatus(pendingStatus);
        saveTransactionStatus(pendingStatus); // Important: save before redirect
      }

    } catch (error) {
      console.error('Buy error:', error);
      const errorStatus = {
        status: 'error' as const,
        message: 'Failed to prepare transaction',
        hash: undefined
      };
      setTransactionStatus(errorStatus);
      saveTransactionStatus(errorStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSell = async () => {
    if (!amount || Number(amount) <= 0 || !fundTokenId) return;
    
    try {
      setIsSubmitting(true);

      const amountWithDecimals = (Number(amount) * Math.pow(10, 18)).toString();
      const tokenIdHex = Buffer.from(fundTokenId).toString('hex');
      const amountHex = toEvenHex(BigInt(amountWithDecimals));
      const sellFunctionName = Buffer.from('sell').toString('hex');
      const data = `ESDTTransfer@${tokenIdHex}@${amountHex}@${sellFunctionName}`;

      // Set initial pending status
      const initialStatus = {
        status: 'pending' as const,
        message: 'Preparing transaction...'
      };
      setTransactionStatus(initialStatus);

      const result = await sendTransactions({
        transactions: [{
          value: '0',
          data: data,
          receiver: fundAddress,
          gasLimit: 500000000,
          chainID: 'D',
          version: 1,
        }],
        transactionsDisplayInfo: {
          processingMessage: 'Processing sell transaction',
          errorMessage: 'An error occurred during the sell transaction',
          successMessage: 'Successfully sold shares',
        },
        redirectAfterSign: true,
      });

      if (result?.sessionId) {
        setSessionId(result.sessionId);
        
        const txHash = result.transactions?.[0]?.hash;
        if (txHash) {
          const pendingStatus: TransactionStatus = {
            status: 'pending',
            message: 'Transaction in progress...',
            hash: txHash
          };
          setTransactionStatus(pendingStatus);
          saveTransactionStatus(pendingStatus);
        }
      }

    } catch (error) {
      console.error('Sell transaction error:', error);
      toast.error('Failed to process sell transaction');
      setTransactionStatus({
        status: 'error',
        message: 'Failed to prepare transaction'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: () => {
      toast.success('Successfully bought shares!');
      setAmount('0');
    },
    onFail: (errorMessage) => {
      toast.error(`Transaction failed: ${errorMessage}`);
    },
  });

  const calculateTotal = () => {
    if (!amount || Number(amount) <= 0) return '0.00';
    
    const fee = activeTab === 'buy' ? buyFee : sellFee;
    const baseAmount = Number(amount);
    const feeAmount = baseAmount * (fee / 100);
    const total = activeTab === 'buy' 
      ? baseAmount + feeAmount 
      : baseAmount - feeAmount;
      
    return total.toFixed(2);
  };

  // Only clear transaction status when explicitly closing the toast
  // or when transaction is complete
  const onToastClose = () => {
    setTransactionStatus(null);
    clearTransactionStatus();
  };

  // Add this effect to handle transaction status changes
  useEffect(() => {
    if (sessionId && pendingTransactions) {
      const txArray = Object.values(pendingTransactions);
      const currentTx = txArray.find(tx => tx.sessionId === sessionId);

      if (success && currentTx?.hash) {
        setTransactionStatus({
          status: 'success',
          message: 'Transaction completed successfully!',
          hash: currentTx.hash
        });
        clearTransactionStatus();
        setSessionId(null);
      } else if (fail && currentTx?.hash) {
        setTransactionStatus({
          status: 'error',
          message: 'Transaction failed. Please try again.',
          hash: currentTx.hash
        });
        clearTransactionStatus();
        setSessionId(null);
      }
    }
  }, [sessionId, success, fail, pendingTransactions]);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 
                hover:border-white/20 transition-all duration-300
                shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/5 to-white/[0.02] p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white">
          {activeTab === 'buy' ? 'Buy Fund Shares' : 'Sell Fund Shares'}
        </h2>
        <div className="flex items-center gap-4 mt-4 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 relative
                       ${activeTab === 'buy' 
                         ? 'bg-white/10 text-white shadow-inner border border-emerald-500/20' 
                         : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center justify-center gap-2">
              {activeTab === 'buy' && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 
                              animate-pulse shadow-lg shadow-emerald-500/20" />
              )}
              <span className={activeTab === 'buy' ? 'text-emerald-400' : ''}>Buy</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 relative
                       ${activeTab === 'sell' 
                         ? 'bg-white/10 text-white shadow-inner border border-rose-500/20' 
                         : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center justify-center gap-2">
              {activeTab === 'sell' && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 
                              animate-pulse shadow-lg shadow-rose-500/20" />
              )}
              <span className={activeTab === 'sell' ? 'text-rose-400' : ''}>Sell</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main content takes remaining height */}
      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Token Selection - Show different options based on active tab */}
          <div className="space-y-2">
            {activeTab === 'buy' ? (
              <>
                <label className="text-white/60 text-sm">Pay with</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_TOKENS.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => setSelectedPaymentToken(token)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-300
                                 ${selectedPaymentToken.id === token.id
                                   ? 'border-white/20 bg-white/10'
                                   : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}
                    >
                      {(token.id === 'EGLD' ? egldTokenIcon : usdcTokenIcon) ? (
                        <Image
                          src={token.id === 'EGLD' ? egldTokenIcon! : usdcTokenIcon!}
                          alt={token.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-white/10 rounded-full" />
                      )}
                      <span className="text-white font-medium">{token.name}</span>
                      <span className="ml-auto text-white/60">
                        {token.id === 'EGLD' ? egldBalance : usdcBalance}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="text-white/60 text-sm">Available Fund Shares</label>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                  {fundTokenIcon ? (
                    <Image
                      src={fundTokenIcon}
                      alt="Fund Token"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-primary/20" />
                  )}
                  <span className="text-white font-medium">{fundTokenId}</span>
                  <span className="ml-auto text-white/60">{fundTokenBalance}</span>
                </div>
              </>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm">
              {activeTab === 'buy' ? 'Amount' : 'Shares to Sell'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount === '0' ? '' : amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white
                           placeholder-white/40 focus:outline-none focus:border-white/20
                           transition-all duration-300 [appearance:textfield] 
                           [&::-webkit-outer-spin-button]:appearance-none 
                           [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                {activeTab === 'buy' ? selectedPaymentToken.name : 'Shares'}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-white/[0.02] rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">You'll receive</span>
              <span className="text-white font-medium">≈ {calculateShares()} Shares</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Share Price</span>
              <span className="text-white font-medium">${sharePrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Fee</span>
              <span className="text-white font-medium">{activeTab === 'buy' ? buyFee : sellFee}%</span>
            </div>
          </div>
        </div>
        
        {/* Transaction Toast and Button Container */}
        <div>
          {transactionStatus && (
            <TransactionToast
              status={transactionStatus.status}
              message={transactionStatus.message}
              hash={transactionStatus.hash}
              onClose={onToastClose}
            />
          )}
          
          {/* Action Button */}
          <button
            onClick={activeTab === 'buy' ? handleBuy : handleSell}
            disabled={!isLoggedIn || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-medium relative
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-300 group
                        ${activeTab === 'buy' 
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20' 
                          : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20'}`}
          >
            <div className="flex items-center justify-center gap-3">
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full animate-pulse
                                ${activeTab === 'buy' 
                                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' 
                                  : 'bg-rose-500 shadow-lg shadow-rose-500/20'}`} 
                  />
                  <span className={`font-medium ${activeTab === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {activeTab === 'buy' ? 'Buy Shares' : 'Sell Shares'}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}; 