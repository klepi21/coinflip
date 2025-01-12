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

  const calculateShares = () => {
    if (!amount || amount === '0') return '0';
    return activeTab === 'buy' 
      ? (Number(amount) / Number(sharePrice)).toFixed(4)
      : (Number(amount) * Number(sharePrice)).toFixed(6);
  };

  const handleBuy = async () => {
    if (!amount || Number(amount) <= 0) return;
    
    try {
      setIsSubmitting(true);
      
      const paymentTokenId = selectedPaymentToken.id;
      const paymentAmount = BigInt(Math.floor(Number(amount) * Math.pow(10, selectedPaymentToken.decimals)));
      const buyFunctionName = Buffer.from('buy').toString('hex');

      // Build the transaction
      const tx = {
        value: selectedPaymentToken.id === 'EGLD' ? paymentAmount.toString() : '0',
        data: selectedPaymentToken.id === 'EGLD' 
          ? `${buyFunctionName}`
          : `ESDTTransfer@${Buffer.from(paymentTokenId).toString('hex')}@${toEvenHex(paymentAmount)}@${buyFunctionName}`,
        receiver: fundAddress,
        gasLimit: 500000000,
      };

      console.log('Buy transaction:', {
        paymentTokenId,
        paymentAmount: paymentAmount.toString(),
        txData: tx.data,
        buyFunctionHex: buyFunctionName
      });

      const { sessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing buy shares transaction',
          errorMessage: 'An error occurred during the buy shares transaction',
          successMessage: 'Buy shares transaction successful'
        },
      });

      setSessionId(sessionId);
    } catch (error) {
      console.error('Buy error:', error);
      toast.error('Failed to buy shares');
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

      const { sessionId, error } = await sendTransactions({
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
        redirectAfterSign: false,
      });

      if (error) {
        throw new Error(error);
      }

      setSessionId(sessionId);

    } catch (error) {
      console.error('Sell transaction error:', error);
      toast.error('Failed to process sell transaction');
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

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 h-full
                    hover:border-white/20 transition-all duration-300
                    shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* Buy/Sell Tabs - Updated styling */}
      <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-8">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
            activeTab === 'buy' 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
            activeTab === 'sell' 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-white/60 text-sm font-medium">
              {activeTab === 'buy' ? 'YOU PAY' : 'YOU SELL'}
            </span>
            <span className="text-white/60 text-sm truncate ml-2">
              Balance: {activeTab === 'buy' 
                ? (selectedPaymentToken.id === 'EGLD' ? egldBalance : usdcBalance) 
                : fundTokenBalance}
            </span>
          </div>
          <div className="bg-black/60 hover:bg-black/80 transition-colors rounded-xl p-3 sm:p-6 
                          flex flex-col sm:flex-row sm:items-center gap-3 border border-white/5">
            {/* Token selector - Mobile optimized */}
            <div className="flex-shrink-0">
              {activeTab === 'buy' ? (
                <button 
                  className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors"
                  onClick={() => (document.getElementById('token-selector') as HTMLDialogElement)?.showModal()}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedPaymentToken.id === 'EGLD' ? egldTokenIcon || '/placeholder.png' : usdcTokenIcon || '/placeholder.png'}
                      alt={selectedPaymentToken.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-medium text-sm sm:text-base whitespace-nowrap">
                    {selectedPaymentToken.name}
                  </div>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7 10l5 5 5-5H7z"/>
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                    <Image
                      src={fundTokenIcon || '/placeholder.png'}
                      alt="Fund Token"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-medium text-sm sm:text-base">Shares</div>
                </div>
              )}
            </div>

            {/* Input field - Mobile optimized */}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-white text-right flex-1 outline-none text-base sm:text-lg w-full"
              placeholder="0"
              max={activeTab === 'sell' ? fundTokenBalance : undefined}
            />
          </div>
        </div>

        {/* Price and Fees - Now with dynamic fees */}
        <div className="bg-black/40 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/80 font-medium">Share Price</span>
            <span className="text-white font-mono">${Number(sharePrice).toFixed(6)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/80 font-medium">Fees</span>
            <span className="text-primary font-mono">
              {activeTab === 'buy' ? `${buyFee}%` : `${sellFee}%`}
            </span>
          </div>
        </div>

        {/* Output Section - Updated to show token ID in buy mode */}
        <div>
          <div className="text-white/60 mb-2 text-sm font-medium">
            {activeTab === 'buy' ? 'YOU RECEIVE' : 'YOU RECEIVE'}
          </div>
          <div className="bg-black/60 hover:bg-black/80 transition-colors rounded-xl p-3 sm:p-6 
                          flex flex-col sm:flex-row sm:items-center gap-3 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                <Image
                  src={activeTab === 'buy' 
                    ? (fundTokenIcon || '/placeholder.png')
                    : (selectedPaymentToken.id === 'EGLD' ? egldTokenIcon || '/placeholder.png' : usdcTokenIcon || '/placeholder.png')}
                  alt={activeTab === 'buy' ? 'Fund Token' : selectedPaymentToken.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="font-medium text-sm sm:text-base">
                {activeTab === 'buy' ? 'Shares' : 'USDC'}
              </div>
            </div>
            <div className="text-white text-right flex-1 font-mono text-base sm:text-lg">
              <span className="text-white/60 mr-1">≈</span>
              {calculateShares()}
            </div>
          </div>
        </div>

        {/* Action Button - Updated styling and text */}
        <button
          disabled={!isLoggedIn || amount === '0' || isSubmitting}
          onClick={activeTab === 'buy' ? handleBuy : handleSell}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200
                     ${activeTab === 'buy' 
                       ? 'bg-primary hover:bg-primary/90 disabled:bg-primary/50' 
                       : 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50'}
                     text-white shadow-lg disabled:shadow-none`}
        >
          {!isLoggedIn 
            ? 'Connect Wallet' 
            : isSubmitting 
              ? 'Processing...' 
              : activeTab === 'buy'
                ? `Buy ${amount} ${selectedPaymentToken.name}`
                : `Sell ${amount} Shares`}
        </button>
      </div>

      {/* Add Token Selector Modal */}
      <dialog 
        id="token-selector" 
        className="modal bg-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            (e.target as HTMLDialogElement).close();
          }
        }}
      >
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-white">Select Token</h3>
          <div className="space-y-2">
            {PAYMENT_TOKENS.map((token) => (
              <button
                key={token.id}
                onClick={() => {
                  setSelectedPaymentToken(token);
                  (document.getElementById('token-selector') as HTMLDialogElement)?.close();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Image
                  src={token.id === 'EGLD' ? egldTokenIcon || '/placeholder.png' : usdcTokenIcon || '/placeholder.png'}
                  alt={token.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-medium text-white">{token.name}</span>
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}; 