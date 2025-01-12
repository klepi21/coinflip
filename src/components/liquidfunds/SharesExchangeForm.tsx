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

  // Fetch user's balance only
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;
      console.log('Fetching balances for:', { address, fundTokenId });

      try {
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

      const amountWithDecimals = (Number(amount) * Math.pow(10, USDC_DECIMALS)).toString();
      const tokenIdHex = Buffer.from(USDC_IDENTIFIER).toString('hex');
      const amountHex = toEvenHex(BigInt(amountWithDecimals));
      const buyFunctionName = Buffer.from('buy').toString('hex');
      const data = `ESDTTransfer@${tokenIdHex}@${amountHex}@${buyFunctionName}`;

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
          processingMessage: 'Processing buy transaction',
          errorMessage: 'An error occurred during the buy transaction',
          successMessage: 'Buy transaction successful',
        },
        redirectAfterSign: false,
      });

      if (error) {
        throw new Error(error);
      }

      setSessionId(sessionId);
      console.log('Transaction sent:', { sessionId, data });

    } catch (error) {
      console.error('Buy transaction error:', error);
      toast.error('Failed to process buy transaction');
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
        {/* Input Section - Enhanced styling */}
        <div>
          <div className="text-white/60 mb-2 text-sm font-medium">
            {activeTab === 'buy' ? 'YOU PAY' : 'YOU SELL'}
          </div>
          <div className="bg-black/60 hover:bg-black/80 transition-colors rounded-xl p-6 flex items-center gap-4 border border-white/5">
            <div className="flex items-center gap-2">
              {activeTab === 'buy' ? (
                <>
                  {usdcTokenIcon ? (
                    <Image 
                      src={usdcTokenIcon}
                      alt="USDC"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Image 
                      src="/tokens/usdc.png"
                      alt="USDC"
                      width={32}
                      height={32}
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-white font-semibold">WrappedUSDC</span>
                    <span className="text-sm text-white/60">
                      Balance: {Number(usdcBalance).toFixed(6)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {fundTokenIcon ? (
                    <Image 
                      src={fundTokenIcon}
                      alt="Fund Token"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-white font-semibold">Fund Shares</span>
                    <span className="text-white/60 font-mono text-xs">
                      {fundTokenId}
                    </span>
                    <span className="text-sm text-white/60">
                      Balance: {Number(fundTokenBalance).toFixed(4)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-white text-right flex-1 outline-none"
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

        {/* Output Section - Updated with USDC icon in sell mode */}
        <div>
          <div className="text-white/60 mb-2 text-sm font-medium">
            {activeTab === 'buy' ? 'YOU RECEIVE' : 'YOU RECEIVE'}
          </div>
          <div className="bg-black/60 hover:bg-black/80 transition-colors rounded-xl p-6 flex items-center gap-4 border border-white/5">
            <div className="flex items-center gap-2">
              {activeTab === 'buy' ? (
                <>
                  {fundTokenIcon ? (
                    <Image 
                      src={fundTokenIcon}
                      alt="Fund Token"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                  )}
                  <span className="text-white font-semibold">Shares</span>
                </>
              ) : (
                <>
                  {usdcTokenIcon ? (
                    <Image 
                      src={usdcTokenIcon}
                      alt="USDC"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Image 
                      src="/tokens/usdc.png"
                      alt="USDC"
                      width={32}
                      height={32}
                    />
                  )}
                  <span className="text-white font-semibold">WrappedUSDC</span>
                </>
              )}
            </div>
            <div className="text-white text-right flex-1 font-mono text-lg">
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
                ? `Buy ${amount} USDC`
                : `Sell ${amount} Shares`}
        </button>
      </div>
    </div>
  );
}; 