'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { RetroGrid } from '@/components/ui/retro-grid';
import { TokenSelector } from '@/components/ui/TokenSelector';
import { useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { toast, Toaster } from 'sonner';
import { Token, useSwap, useSwapQuote, QX_CONSTANTS, formatAmount } from '@/core/ashswap';

export default function TestSwap() {
  const { address } = useGetAccountInfo();
  const { executeSwap, isLoading: isSwapping } = useSwap();
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');

  const { quote, isLoading: isQuoting, error: quoteError } = useSwapQuote({
    tokenIn: tokenIn?.identifier,
    tokenOut: tokenOut?.identifier,
    amountIn: amount,
    slippage: QX_CONSTANTS.DEFAULT_SLIPPAGE
  });

  const handleSwap = async () => {
    if (!quote?.bestRoute || !address || !tokenIn || !tokenOut) return;

    try {
      const loadingToastId = toast.loading(
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-white">Processing Swap...</p>
          <p className="text-sm text-zinc-400">Please wait while we process your transaction</p>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          }
        }
      );

      await executeSwap({
        tokenIn: tokenIn.identifier,
        tokenOut: tokenOut.identifier,
        amountIn: amount,
        userAddress: address,
        route: quote.bestRoute
      });

      toast.dismiss(loadingToastId);
      toast.success('Swap completed successfully!');
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Failed to execute swap');
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
            color: 'white',
          },
        }}
      />
      <div className="h-full overflow-auto pt-24">
        <div className="container max-w-lg mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Swap Tokens</h2>
                <p className="text-zinc-400">Trade tokens instantly with AshSwap</p>
              </div>

              <div className="space-y-4">
                <TokenSelector
                  value={tokenIn}
                  onChange={setTokenIn}
                  label="From"
                />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAmount(value);
                    }}
                    placeholder="0.0"
                    className="w-full p-3 rounded-xl bg-black/20 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                  />
                  {tokenIn && amount && (
                    <div className="text-sm text-zinc-400">
                      Balance: {tokenIn.balance || '0.00'} {tokenIn.ticker}
                    </div>
                  )}
                </div>

                <TokenSelector
                  value={tokenOut}
                  onChange={setTokenOut}
                  label="To"
                />
                {tokenOut && quote && (
                  <div className="text-sm text-zinc-400">
                    You will receive: {formatAmount(quote.bestRoute.amountOut, tokenOut.decimals)} {tokenOut.ticker}
                  </div>
                )}
              </div>

              {quote && (
                <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Expected Output:</span>
                    <span className="text-white font-medium">
                      {formatAmount(quote.bestRoute.amountOut, tokenOut?.decimals || 18)} {tokenOut?.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Market Price:</span>
                    <span className="text-white font-medium">
                      1 {tokenIn?.ticker} = {(Number(formatAmount(quote.bestRoute.amountOut, tokenOut?.decimals || 18)) / Number(amount)).toFixed(6)} {tokenOut?.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Price Impact:</span>
                    <span className={`font-medium ${
                      quote.bestRoute.priceImpact > 5 ? 'text-red-500' : 'text-[#C99733]'
                    }`}>
                      {(quote.bestRoute.priceImpact * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              {!address ? (
                <div className="text-center">
                  <p className="text-zinc-400 mb-4">Connect your wallet to swap</p>
                </div>
              ) : (
                <button
                  onClick={handleSwap}
                  disabled={isSwapping || isQuoting || !quote || !tokenIn || !tokenOut || !amount}
                  className={`w-full px-8 py-3 rounded-full font-semibold transition-all ${
                    isSwapping || isQuoting || !quote || !tokenIn || !tokenOut || !amount
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black hover:opacity-90'
                  }`}
                >
                  {isSwapping ? 'Swapping...' : 
                   isQuoting ? 'Loading Quote...' :
                   !tokenIn || !tokenOut ? 'Select Tokens' :
                   !amount ? 'Enter Amount' :
                   'Swap'}
                </button>
              )}

              {quoteError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {quoteError}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 