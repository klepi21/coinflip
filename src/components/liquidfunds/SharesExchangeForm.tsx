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
          ? `buy`
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
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                       ${activeTab === 'buy' 
                         ? 'bg-white/10 text-white shadow-inner' 
                         : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                       ${activeTab === 'sell' 
                         ? 'bg-white/10 text-white shadow-inner' 
                         : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            Sell
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
                    <div className="w-6 h-6 bg-white/10 rounded-full" />
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white
                           placeholder-white/40 focus:outline-none focus:border-white/20
                           transition-all duration-300"
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
              <span className="text-white font-medium">{calculateShares()} Shares</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Share Price</span>
              <span className="text-white font-medium">${sharePrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Fee</span>
              <span className="text-white font-medium">{activeTab === 'buy' ? buyFee : sellFee}%</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white/80">Total</span>
              <span className="text-white font-bold">${calculateTotal()}</span>
            </div>
          </div>
        </div>
        
        {/* Action Button at bottom */}
        <button
          onClick={activeTab === 'buy' ? handleBuy : handleSell}
          disabled={!isLoggedIn || isSubmitting}
          className="w-full bg-white/10 hover:bg-white/15 
                     py-4 px-6 rounded-xl text-white font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300"
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            activeTab === 'buy' ? 'Buy Shares' : 'Sell Shares'
          )}
        </button>
      </div>
    </div>
  );
}; 