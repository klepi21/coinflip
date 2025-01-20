'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useWallet } from '@/context/WalletContext';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from "sonner";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqjksmaalhed4gu59tfn0gtkscl8s2090du7zs6nrdts';
const USDC_IDENTIFIER = 'USDC-350c4e';

// Token data with images
const TOKENS = {
  EGLD: {
    id: 'EGLD',
    name: 'EGLD',
    image: 'https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png',
    decimals: 18
  },
  USDC: {
    id: 'USDC',
    name: 'USDC',
    image: `https://tools.multiversx.com/assets-cdn/devnet/tokens/${USDC_IDENTIFIER}/icon.svg`,
    decimals: 6
  }
};

// Helper function
const toHexEven = (num: number) => {
  let hex = (num).toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return hex;
};

const GAME_MULTIPLIERS = [1, 2, 5, 10, 15];

export default function Create() {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'EGLD' | 'USDC'>('EGLD');
  const [multiplier, setMultiplier] = useState(1);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    message: string;
    isLoading: boolean;
    gameResult: null;
  }>({
    isOpen: false,
    message: '',
    isLoading: false,
    gameResult: null
  });

  const { isLoggedIn, address } = useWallet();
  const { account } = useGetAccountInfo();
  const { balance: usdcBalance, isLoading: isLoadingUsdcBalance } = useTokenBalance(address || '', USDC_IDENTIFIER);
  
  // Use raw balance divided by 10^18 for EGLD
  const egldBalance = account?.balance ? Number(account.balance) / Math.pow(10, 18) : 0;
  const isLoadingBalance = isLoadingUsdcBalance;

  const handleLogin = () => {
    setShowWalletModal(true);
  };

  const handleCreateGame = async () => {
    try {
      setIsSubmitting(true);
      setIsWaitingForTx(true);

      const decimalAmount = selectedToken === 'USDC' ? 6 : 18;
      // Calculate total amount (amount per game * number of games)
      const totalAmount = parseFloat(amount) * multiplier;
      const rawAmount = totalAmount * Math.pow(10, decimalAmount);

      // Convert side to u8 value (0 for heads, 1 for tails)
      const sideValue = selectedSide === 'heads' ? 0 : 1;

      // Create transaction data
      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [{
          value: selectedToken === 'EGLD' ? totalAmount.toString() : '0',
          data: selectedToken === 'USDC' 
            ? `ESDTTransfer@${Buffer.from(USDC_IDENTIFIER).toString('hex')}@${toHexEven(Math.floor(rawAmount))}@${Buffer.from('create').toString('hex')}@${toHexEven(multiplier)}@${toHexEven(sideValue)}`
            : `create@${toHexEven(multiplier)}@${toHexEven(sideValue)}`,
          receiver: SC_ADDRESS,
          gasLimit: 100000000,
        }],
        transactionsDisplayInfo: {
          processingMessage: `Creating ${multiplier} game${multiplier > 1 ? 's' : ''} with ${totalAmount} ${selectedToken}...`,
          errorMessage: 'Failed to create game',
          successMessage: `Successfully created ${multiplier} game${multiplier > 1 ? 's' : ''}!`
        }
      });
      
      if (newSessionId) {
        setSessionId(newSessionId);
      }

    } catch (error) {
      // console.error('Game creation error:', error);
      toast.error('Failed to create game');
      setIsSubmitting(false);
      setIsWaitingForTx(false);
    }
  };

  const getButtonState = () => {
    if (!isLoggedIn) return { 
      disabled: false, 
      message: 'Login to play',
      action: handleLogin,
      text: 'Connect Wallet'
    };
    if (isSubmitting) return { 
      disabled: true, 
      message: null,
      action: handleCreateGame,
      text: 'Creating Game...'
    };
    if (isLoadingBalance) return { 
      disabled: true, 
      message: 'Loading balance...',
      action: handleCreateGame,
      text: 'Create Game'
    };
    
    const currentBalance = selectedToken === 'USDC' ? usdcBalance : egldBalance;
    const amountValue = parseFloat(amount);
    const totalAmount = amountValue * multiplier;
    
    if (currentBalance === 0) return { 
      disabled: true, 
      message: `No ${selectedToken} tokens in wallet`,
      action: handleCreateGame,
      text: 'Create Game'
    };
    if (currentBalance < totalAmount) return { 
      disabled: true, 
      message: `Insufficient ${selectedToken} balance (${currentBalance.toFixed(2)} ${selectedToken} available)`,
      action: handleCreateGame,
      text: 'Create Game'
    };
    if (!amount || amountValue <= 0) return { 
      disabled: true, 
      message: 'Enter an amount',
      action: handleCreateGame,
      text: 'Create Game'
    };
    if (!selectedSide) return { 
      disabled: true, 
      message: 'Select a side',
      action: handleCreateGame,
      text: 'Create Game'
    };
    
    return { 
      disabled: false, 
      message: null,
      action: handleCreateGame,
      text: 'Create Game'
    };
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWaitingForTx) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWaitingForTx]);

  useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: () => {
      setIsWaitingForTx(false);
      setAmount('');
      setSelectedSide(null);
      setIsSubmitting(false);
      
      // Show success popup
      setPopup({
        isOpen: true,
        message: 'Your game has been created! Good luck!',
        isLoading: false,
        gameResult: null
      });
      
      // Close popup after 5 seconds
      setTimeout(() => {
        setPopup(prev => ({ ...prev, isOpen: false }));
      }, 5000);
    },
    onFail: (errorMessage) => {
      toast.error(`Transaction failed: ${errorMessage}`);
      setIsWaitingForTx(false);
      setIsSubmitting(false);
    },
  });

  const buttonState = getButtonState();

  return (
    <div className="hidden md:block bg-[#1A1A1A] rounded-3xl border border-zinc-800 shadow-xl mb-8 overflow-hidden">
      <div className="p-6">
        {isWaitingForTx ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#75CBDD] border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Creating Your Game{multiplier > 1 ? 's' : ''}</h3>
              <p className="text-zinc-400">Transaction in progress...</p>
              <p className="text-zinc-500 text-sm mt-2">Time elapsed: {elapsedTime}s</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Animated Coin at the top */}
            <div className="flex justify-center">
              <motion.div 
                className="relative w-48 h-48"
                animate={{ rotateY: selectedSide ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                key={selectedSide}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-black shadow-2xl flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#75CBDD] to-[#5B9EA9] flex items-center justify-center overflow-hidden">
                    {selectedSide === 'heads' ? (
                      <div className="text-6xl">🍒</div>
                    ) : selectedSide === 'tails' ? (
                      <div className="text-6xl">🍑</div>
                    ) : (
                      <div className="text-6xl">?</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Amount</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder-zinc-500 outline-none focus:border-[#75CBDD]"
                    placeholder="Enter amount"
                  />
                  <div className="relative">
                    <select 
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value as 'EGLD' | 'USDC')}
                      className="appearance-none bg-black text-white pl-10 pr-10 py-3 rounded-xl border border-zinc-800 outline-none focus:border-[#75CBDD] cursor-pointer hover:bg-zinc-900 transition-colors"
                    >
                      {Object.values(TOKENS).map((token) => (
                        <option 
                          key={token.id} 
                          value={token.id}
                          className="bg-black hover:bg-zinc-900"
                        >
                          {token.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={TOKENS[selectedToken].image}
                        alt={selectedToken}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">How many games to create?</label>
                <div className="flex gap-2">
                  {GAME_MULTIPLIERS.map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setMultiplier(mult)}
                      className={`flex-1 h-12 rounded-xl ${
                        multiplier === mult ? 'bg-[#75CBDD] text-black' : 'bg-zinc-800 text-white'
                      } font-medium transition-all hover:bg-[#75CBDD] hover:text-black`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Pick a side</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedSide('heads')}
                    className={`flex-1 h-16 rounded-xl ${
                      selectedSide === 'heads' 
                        ? 'bg-[#75CBDD] border-2 border-black text-black' 
                        : 'bg-zinc-800 text-white'
                    } font-medium transition-all flex items-center justify-center gap-2 hover:bg-[#75CBDD]/80 hover:text-black`}
                  >
                    <span>HEADS 🪙</span>
                  </button>
                  <button
                    onClick={() => setSelectedSide('tails')}
                    className={`flex-1 h-16 rounded-xl ${
                      selectedSide === 'tails' 
                        ? 'bg-[#75CBDD] border-2 border-black text-black' 
                        : 'bg-zinc-800 text-white'
                    } font-medium transition-all flex items-center justify-center gap-2 hover:bg-[#75CBDD]/80 hover:text-black`}
                  >
                    <span>TAILS 🪙</span>
                  </button>
                </div>
              </div>

              <button
                onClick={buttonState.action}
                disabled={buttonState.disabled}
                className={`w-full h-14 rounded-xl font-medium transition-all ${
                  !buttonState.disabled
                    ? 'bg-[#75CBDD] hover:bg-[#75CBDD]/90 text-black'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {buttonState.text}
              </button>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">Balance:</span>
                {isLoadingBalance ? (
                  <span className="text-zinc-400">Loading...</span>
                ) : (
                  <span className="text-white font-medium">
                    {selectedToken === 'USDC' 
                      ? `${usdcBalance.toFixed(2)} USDC`
                      : `${egldBalance} EGLD`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      {/* Success Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] rounded-3xl p-8 max-w-md w-full mx-4 relative border border-zinc-800 shadow-[0_0_50px_-12px] shadow-[#75CBDD]/20">
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#75CBDD]/10">
                  <span className="text-5xl animate-bounce">🎲</span>
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-[#75CBDD]/30 animate-pulse"></div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-[#75CBDD]">Game Created!</h3>
                <p className="text-zinc-400">Your game has been created successfully. Good luck!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 