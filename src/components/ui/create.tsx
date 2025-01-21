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
  const [selectedToken] = useState<'USDC'>('USDC');
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
  const isLoadingBalance = isLoadingUsdcBalance;

  // Reset popup when component mounts or when sessionId changes to null
  useEffect(() => {
    if (!sessionId) {
      setPopup({
        isOpen: false,
        message: '',
        isLoading: false,
        gameResult: null
      });
    }
  }, [sessionId]);

  const handleLogin = () => {
    setShowWalletModal(true);
  };

  const handleCreateGame = async () => {
    try {
      setIsSubmitting(true);
      setIsWaitingForTx(true);

      const decimalAmount = 6; // USDC decimals
      // Calculate total amount (amount per game * number of games)
      const totalAmount = parseFloat(amount) * multiplier;
      const rawAmount = totalAmount * Math.pow(10, decimalAmount);

      // Convert side to u8 value (0 for heads, 1 for tails)
      const sideValue = selectedSide === 'heads' ? 0 : 1;

      // Create transaction data
      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [{
          value: '0',
          data: `ESDTTransfer@${Buffer.from(USDC_IDENTIFIER).toString('hex')}@${toHexEven(Math.floor(rawAmount))}@${Buffer.from('create').toString('hex')}@${toHexEven(multiplier)}@${toHexEven(sideValue)}`,
          receiver: SC_ADDRESS,
          gasLimit: 100000000,
        }],
        transactionsDisplayInfo: {
          processingMessage: `Creating ${multiplier} game${multiplier > 1 ? 's' : ''} with ${totalAmount} USDC...`,
          errorMessage: 'Failed to create game',
          successMessage: `Successfully created ${multiplier} game${multiplier > 1 ? 's' : ''}!`
        }
      });
      
      if (newSessionId) {
        setSessionId(newSessionId);
      }

    } catch (error) {
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
    
    const currentBalance = usdcBalance;
    const amountValue = parseFloat(amount);
    const totalAmount = amountValue * multiplier;
    
    if (currentBalance === 0) return { 
      disabled: true, 
      message: 'No USDC tokens in wallet',
      action: handleCreateGame,
      text: 'Create Game'
    };
    if (currentBalance < totalAmount) return { 
      disabled: true, 
      message: `Insufficient USDC balance (${currentBalance.toFixed(2)} USDC available)`,
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
      
      // Show success popup immediately
      setPopup({
        isOpen: true,
        message: 'We are creating your game, good luck.',
        isLoading: false,
        gameResult: null
      });
      
      // Close popup after 5 seconds
      setTimeout(() => {
        setPopup(prev => ({ ...prev, isOpen: false }));
        setSessionId(null); // Reset sessionId after popup closes
      }, 5000);
    },
    onFail: (errorMessage) => {
      toast.error(`Transaction failed: ${errorMessage}`);
      setIsWaitingForTx(false);
      setIsSubmitting(false);
      setSessionId(null);
    },
  });

  const buttonState = getButtonState();

  return (
    <>
      {/* Mobile Create Button */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setShowWalletModal(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black flex items-center justify-center shadow-lg border-4 border-black hover:scale-105 transition-transform"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>

      {/* Mobile Create Form Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] md:hidden">
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-end p-4">
              <button 
                onClick={() => setShowWalletModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="bg-[#1A1A1A] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden max-w-sm mx-auto">
                <div className="p-4">
                  {/* Mobile Form Content */}
                  <div className="space-y-6">
                    {/* Smaller Coin Animation */}
                    <div className="flex justify-center">
                      <motion.div 
                        className="relative w-32 h-32"
                        animate={{ rotateY: selectedSide ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        key={selectedSide}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-black shadow-2xl flex items-center justify-center">
                          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#C99733] to-[#FFD163] flex items-center justify-center overflow-hidden">
                            {selectedSide === 'heads' ? (
                              <Image
                                src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg"
                                alt="MINCU"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                              />
                            ) : selectedSide === 'tails' ? (
                              <Image
                                src="https://i.ibb.co/2SdHttC/lower2.png"
                                alt="Lower Expectations"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                              />
                            ) : (
                              <div className="text-4xl">?</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Mobile Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-zinc-400 text-sm mb-2">Amount</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white text-base font-medium placeholder-zinc-500 outline-none focus:border-[#C99733]"
                            placeholder="Enter amount"
                          />
                          <div className="relative">
                            <div className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-xl border border-zinc-800">
                              <div className="w-4 h-4 rounded-full overflow-hidden">
                                <Image
                                  src={TOKENS.USDC.image}
                                  alt="USDC"
                                  width={16}
                                  height={16}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-sm">USDC</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 text-sm mb-2">Games to create</label>
                        <div className="flex gap-1">
                          {GAME_MULTIPLIERS.map((mult) => (
                            <button
                              key={mult}
                              onClick={() => setMultiplier(mult)}
                              className={`flex-1 h-10 rounded-xl text-sm ${
                                multiplier === mult ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' : 'bg-zinc-800 text-white'
                              } font-medium transition-all`}
                            >
                              {mult}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 text-sm mb-2">Pick a side</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedSide('heads')}
                            className={`flex-1 h-12 rounded-xl ${
                              selectedSide === 'heads' 
                                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                                : 'bg-zinc-800 text-white'
                            } font-medium transition-all flex items-center justify-center gap-2`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20 p-1">
                              <Image
                                src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg"
                                alt="MINCU"
                                width={24}
                                height={24}
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                            <span className="text-sm">MINCU</span>
                          </button>
                          <button
                            onClick={() => setSelectedSide('tails')}
                            className={`flex-1 h-12 rounded-xl ${
                              selectedSide === 'tails' 
                                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                                : 'bg-zinc-800 text-white'
                            } font-medium transition-all flex items-center justify-center gap-2`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20 p-1">
                              <Image
                                src="https://i.ibb.co/2SdHttC/lower2.png"
                                alt="Lower Expectations"
                                width={24}
                                height={24}
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                            <span className="text-sm">Lower</span>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={buttonState.action}
                        disabled={buttonState.disabled}
                        className={`w-full h-12 rounded-xl text-sm font-medium transition-all ${
                          !buttonState.disabled
                            ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {buttonState.text}
                      </button>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Balance:</span>
                        {isLoadingBalance ? (
                          <span className="text-zinc-400">Loading...</span>
                        ) : (
                          <span className="text-white font-medium">
                            {usdcBalance.toFixed(2)} USDC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Version */}
      <div className="hidden md:block bg-[#1A1A1A] rounded-3xl border border-zinc-800 shadow-xl mb-8 overflow-hidden">
        <div className="p-6">
          {isWaitingForTx ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C99733] border-t-transparent"></div>
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
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#C99733] to-[#FFD163] flex items-center justify-center overflow-hidden">
                      {selectedSide === 'heads' ? (
                        <Image
                          src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg"
                          alt="MINCU"
                          width={64}
                          height={64}
                          className="w-16 h-16"
                        />
                      ) : selectedSide === 'tails' ? (
                        <Image
                          src="https://i.ibb.co/2SdHttC/lower2.png"
                          alt="Lower Expectations"
                          width={64}
                          height={64}
                          className="w-16 h-16"
                          style={{ transform: 'scaleX(-1)' }}
                        />
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
                      className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder-zinc-500 outline-none focus:border-[#C99733]"
                      placeholder="Enter amount"
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-black text-white pl-4 pr-4 py-3 rounded-xl border border-zinc-800">
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          <Image
                            src={TOKENS.USDC.image}
                            alt="USDC"
                            width={20}
                            height={20}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>USDC</span>
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
                          multiplier === mult ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' : 'bg-zinc-800 text-white'
                        } font-medium transition-all hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
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
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                          : 'bg-zinc-800 text-white'
                      } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                        <Image
                          src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg"
                          alt="MINCU"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                      <span>MINCU</span>
                    </button>
                    <button
                      onClick={() => setSelectedSide('tails')}
                      className={`flex-1 h-16 rounded-xl ${
                        selectedSide === 'tails' 
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                          : 'bg-zinc-800 text-white'
                      } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                        <Image
                          src="https://i.ibb.co/2SdHttC/lower2.png"
                          alt="Lower Expectations"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain rounded-full"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      </div>
                      <span>Lower Expectations</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={buttonState.action}
                  disabled={buttonState.disabled}
                  className={`w-full h-14 rounded-xl font-medium transition-all ${
                    !buttonState.disabled
                      ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black'
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
                      {usdcBalance.toFixed(2)} USDC
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      {/* Success Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] rounded-3xl p-8 max-w-md w-full mx-4 relative border border-zinc-800 shadow-[0_0_50px_-12px] shadow-[#C99733]/20">
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#C99733]/10">
                  <span className="text-5xl animate-bounce">🎲</span>
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-[#FFD163]/30 animate-pulse"></div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-[#FFD163]">Game Created!</h3>
                <p className="text-zinc-400">Your game has been created successfully. Good luck!</p>
              </div>
              <button
                onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}
                className="mt-4 group relative px-8 py-3 bg-[#1A1A1A] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#C99733] to-[#FFD163] transition-all duration-300 ease-out group-hover:w-full"></div>
                <span className="relative group-hover:text-black">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 