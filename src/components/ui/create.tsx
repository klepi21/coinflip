'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useWallet } from '@/context/WalletContext';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from "sonner";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { TokenPayment } from "@multiversx/sdk-core";

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';
const BOBER_IDENTIFIER = 'BOBER-9eb764';
const ONE_IDENTIFIER = 'ONE-f9954f';
const TOM_IDENTIFIER = 'TOM-48414f';
const BATEMAN_IDENTIFIER = 'BATEMAN-f6fd19';

// Token data with images
const TOKENS = {
  RARE: {
    id: 'RARE',
    name: 'RARE',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 500
  },
  BOD: {
    id: 'BOD',
    name: 'BOD',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${BOD_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 100000
  },
  BOBER: {
    id: 'BOBER',
    name: 'BOBER',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${BOBER_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 2000
  },
  ONE: {
    id: 'ONE',
    name: 'ONE',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${ONE_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 10
  },
  TOM: {
    id: 'TOM',
    name: 'TOM',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${TOM_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 20000
  },
  EGLD: {
    id: 'EGLD',
    name: 'EGLD',
    image: `https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png`,
    decimals: 18,
    minAmount: 0.1
  },
  BATEMAN: {
    id: 'BATEMAN',
    name: 'BATEMAN',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${BATEMAN_IDENTIFIER}/icon.svg`,
    decimals: 18,
    minAmount: 50000
  }
};

const SIDES = {
  GRM: {
    name: 'GRM',
    image: '/img/grm.png?v=3'
  },
  SASU: {
    name: 'SASU',
    image: '/img/sasu.png?v=3'
  }
};

// Helper function
const toHexEven = (num: number) => {
  let hex = (num).toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return hex;
};

const GAME_MULTIPLIERS = [1, 2, 5, 10, 15];

const TOKEN_OPTIONS = [
  { id: 'EGLD', name: 'EGLD', image: '/img/egld.svg', minAmount: '0.05' },
  { id: 'RARE-99e8b0', name: 'RARE', image: 'https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg', minAmount: '10' },
  { id: 'BOD-204877', name: 'BOD', image: 'https://tools.multiversx.com/assets-cdn/tokens/BOD-204877/icon.svg', minAmount: '10000' },
  { id: 'BOBER-9eb764', name: 'BOBER', image: 'https://tools.multiversx.com/assets-cdn/tokens/BOBER-9eb764/icon.svg', minAmount: '10000' },
  { id: 'ONE-f9954f', name: 'ONE', image: 'https://tools.multiversx.com/assets-cdn/tokens/ONE-f9954f/icon.svg', minAmount: '0.5' },
  { id: 'TOM-48414f', name: 'TOM', image: 'https://tools.multiversx.com/assets-cdn/tokens/TOM-48414f/icon.svg', minAmount: '10000' },
  { id: 'BATEMAN-f6fd19', name: 'BATEMAN', image: 'https://tools.multiversx.com/assets-cdn/tokens/BATEMAN-f6fd19/icon.svg', minAmount: '50000' }
];

export default function Create() {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'RARE' | 'BOD' | 'BOBER' | 'ONE' | 'TOM' | 'EGLD' | 'BATEMAN'>('RARE');
  const [multiplier, setMultiplier] = useState(1);
  const [selectedSide, setSelectedSide] = useState<'GRM' | 'SASU' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  const { isLoggedIn, address } = useWallet();
  const { account } = useGetAccountInfo();
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(address || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(address || '', BOD_IDENTIFIER);
  const { balance: boberBalance, isLoading: isLoadingBober } = useTokenBalance(address || '', BOBER_IDENTIFIER);
  const { balance: oneBalance, isLoading: isLoadingOne } = useTokenBalance(address || '', ONE_IDENTIFIER);
  const { balance: tomBalance, isLoading: isLoadingTom } = useTokenBalance(address || '', TOM_IDENTIFIER);
  const { balance: batemanBalance, isLoading: isLoadingBateman } = useTokenBalance(address || '', BATEMAN_IDENTIFIER);
  const isLoadingBalance = isLoadingRare || isLoadingBod || isLoadingBober || isLoadingOne || isLoadingTom || isLoadingBateman;

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

      const sideValue = selectedSide === 'GRM' ? 0 : 1;

      let transaction;
      if (selectedToken === 'EGLD') {
        // For EGLD, use TokenPayment to handle the conversion
        const egldAmount = TokenPayment.egldFromAmount(parseFloat(amount) * multiplier);
        transaction = {
          value: egldAmount.valueOf().toString(),
          data: `create@${toHexEven(multiplier)}@${toHexEven(sideValue)}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000 * multiplier,
        };
      } else {
        // Token transaction
        const decimalAmount = TOKENS[selectedToken].decimals;
        const baseAmount = BigInt(amount);
        const totalAmount = baseAmount * BigInt(multiplier);
        const rawAmount = (totalAmount * BigInt(10 ** decimalAmount)).toString(16).padStart(decimalAmount * 2, '0');
        const tokenIdentifier = selectedToken === 'RARE' ? RARE_IDENTIFIER : 
                               selectedToken === 'BOD' ? BOD_IDENTIFIER :
                               selectedToken === 'BOBER' ? BOBER_IDENTIFIER :
                               selectedToken === 'ONE' ? ONE_IDENTIFIER :
                               TOM_IDENTIFIER;
        transaction = {
          value: '0',
          data: `ESDTTransfer@${Buffer.from(tokenIdentifier).toString('hex')}@${rawAmount}@${Buffer.from('create').toString('hex')}@${toHexEven(multiplier)}@${toHexEven(sideValue)}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000 * multiplier,
        };
      }

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: `Creating ${multiplier} game${multiplier > 1 ? 's' : ''} with ${amount} ${selectedToken}...`,
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
      text: 'Creating Battle...'
    };
    if (isLoadingBalance) return { 
      disabled: true, 
      message: 'Loading balance...',
      action: handleCreateGame,
      text: 'Create Battle'
    };
    
    const currentBalance = selectedToken === 'RARE' ? rareBalance : 
                          selectedToken === 'BOD' ? bodBalance :
                          selectedToken === 'BOBER' ? boberBalance :
                          selectedToken === 'ONE' ? oneBalance :
                          selectedToken === 'TOM' ? tomBalance :
                          Number(account.balance) / Math.pow(10, 18);
    const amountValue = parseFloat(amount);
    const totalAmount = amountValue * multiplier;
    
    if (currentBalance === 0) return { 
      disabled: true, 
      message: `No ${selectedToken} tokens in wallet`,
      action: handleCreateGame,
      text: 'Create Battle'
    };
    if (!amount || amountValue <= 0) return { 
      disabled: true, 
      message: 'Enter an amount',
      action: handleCreateGame,
      text: 'Create Battle'
    };
    if (amountValue < TOKENS[selectedToken].minAmount) return {
      disabled: true,
      message: `Minimum amount is ${TOKENS[selectedToken].minAmount} ${selectedToken}`,
      action: handleCreateGame,
      text: 'Create Battle'
    };
    if (currentBalance < totalAmount) return { 
      disabled: true, 
      message: `Insufficient balance (${currentBalance.toFixed(selectedToken === 'EGLD' ? 4 : 2)} ${selectedToken} available)`,
      action: handleCreateGame,
      text: 'Create Battle'
    };
    if (!selectedSide) return { 
      disabled: true, 
      message: 'Select a side',
      action: handleCreateGame,
      text: 'Create Battle'
    };
    
    return { 
      disabled: false, 
      message: null,
      action: handleCreateGame,
      text: 'Create Battle'
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
      {/* Mobile/Tablet Create Button - Show on all devices except large screens */}
      <div className="lg:hidden fixed bottom-24 right-4 z-[90]">
        <button
          onClick={() => isLoggedIn ? setShowCreateModal(true) : setShowWalletModal(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black flex items-center justify-center shadow-lg border-4 border-black hover:scale-105 transition-transform"
        >
          <span className="text-3xl font-bold">+</span>
        </button>
      </div>

      {/* Mobile/Tablet Create Form Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] lg:hidden"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="w-full h-full flex items-start justify-center overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="w-full max-w-sm mx-4 my-16 bg-[#1A1A1A] rounded-2xl border border-zinc-800 shadow-xl"
            >
              <div className="sticky top-0 z-[201] flex justify-end p-4 bg-[#1A1A1A] border-b border-zinc-800">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700"
                >
                  ×
                </button>
              </div>
              <div className="px-4 pb-8 overflow-y-auto">
                {/* Mobile Form Content */}
                <div className="space-y-6">
                  {/* Updated Side-by-Side Animation */}
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-md h-48 flex items-center justify-between" style={{
                      backgroundImage: "url('/img/pick.jpg')",
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}>
                      {/* GRM Side */}
                      <div className={`w-32 h-40 transition-all duration-300 flex flex-col items-center ${selectedSide === 'GRM' ? 'opacity-100' : 'opacity-40 blur-sm'}`}>
                        <div className="w-32 h-32 flex items-center justify-center">
                          <Image
                            src={SIDES.GRM.image}
                            alt="GRM"
                            width={100}
                            height={100}
                            className="w-28 h-28 object-contain"
                          />
                        </div>
                        <span className="text-black font-bold text-lg mt-2">GRM</span>
                      </div>

                      {/* SASU Side */}
                      <div className={`w-32 h-40 transition-all duration-300 flex flex-col items-center ${selectedSide === 'SASU' ? 'opacity-100' : 'opacity-40 blur-sm'}`}>
                        <div className="w-32 h-32 flex items-center justify-center">
                          <Image
                            src={SIDES.SASU.image}
                            alt="SASU"
                            width={100}
                            height={100}
                            className="w-28 h-28 object-contain"
                          />
                        </div>
                        <span className="text-black font-bold text-lg mt-2">SASU</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">Select Token</label>
                      <div className="flex gap-2">
                        {TOKEN_OPTIONS.map((token) => (
                          <button
                            key={token.id}
                            onClick={() => setSelectedToken(token.id as 'RARE' | 'BOD' | 'BOBER' | 'ONE' | 'TOM' | 'EGLD' | 'BATEMAN')}
                            className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-all ${
                              selectedToken === token.id 
                                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-black' 
                                : 'border-zinc-800 hover:border-[#C99733]'
                            }`}
                            title={`${token.name} (min: ${token.minAmount})`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <Image
                                src={token.image}
                                alt={token.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          // Allow decimals but prevent multiple dots
                          const value = e.target.value;
                          if (value.split('.').length > 2) return; // Prevent multiple dots
                          if (value.startsWith('.')) return; // Prevent starting with dot
                          setAmount(value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key.toLowerCase() === 'e') {
                            e.preventDefault();
                          }
                        }}
                        step={selectedToken === 'EGLD' ? '0.01' : '1'}
                        min={TOKENS[selectedToken].minAmount}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white text-base font-medium placeholder-zinc-500 outline-none focus:border-[#C99733]"
                        placeholder="Enter amount"
                      />
                      {/* Helper message */}
                      <div className="text-sm text-zinc-500 mt-1">
                        Minimum amount: {TOKENS[selectedToken].minAmount} {selectedToken}
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">How many Battles to create?</label>
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
                      <label className="block text-zinc-400 text-sm mb-2">Pick your side</label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setSelectedSide('GRM')}
                          className={`flex-1 h-16 rounded-xl ${
                            selectedSide === 'GRM' 
                              ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                              : 'bg-zinc-800 text-white'
                          } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                            <Image
                              src={SIDES.GRM.image}
                              alt="GRM"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                          <span>GRM</span>
                        </button>
                        <button
                          onClick={() => setSelectedSide('SASU')}
                          className={`flex-1 h-16 rounded-xl ${
                            selectedSide === 'SASU' 
                              ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                              : 'bg-zinc-800 text-white'
                          } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                        >
                          <div className="flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                              <Image
                                src={SIDES.SASU.image}
                                alt="SASU"
                                width={32}
                                height={32}
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                            <span className="ml-3">SASU</span>
                          </div>
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
                      {isLoadingBalance && selectedToken !== 'EGLD' ? (
                        <span className="text-zinc-400">Loading...</span>
                      ) : (
                        <span className="text-white font-medium">
                          {selectedToken === 'EGLD' 
                            ? (Number(account.balance) / Math.pow(10, 18)).toFixed(4)
                            : (selectedToken === 'RARE' ? rareBalance : selectedToken === 'BOD' ? bodBalance : selectedToken === 'BOBER' ? boberBalance : oneBalance).toFixed(2)} {selectedToken}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      {/* Desktop Version - Only show on large screens */}
      <div className="hidden lg:block bg-[#1A1A1A] rounded-3xl border border-zinc-800 shadow-xl mb-8 overflow-hidden">
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
              {/* Updated Side-by-Side Animation */}
              <div className="flex justify-center ">
                <div className="relative w-full max-w-lg h-48 flex items-center justify-between " style={{
                  backgroundImage: "url('/img/pick.jpg')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}>
                  {/* GRM Side */}
                  <div className={`w-32 h-40 ml-8 transition-all duration-300 flex flex-col items-center ${selectedSide === 'GRM' ? 'opacity-100' : 'opacity-99 blur-sm'}`}>
                    <div className="w-32 h-32 flex items-center justify-center">
                      <Image
                        src={SIDES.GRM.image}
                        alt="GRM"
                        width={100}
                        height={100}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <span className="text-white font-bold text-lg mb-8">GRM</span>
                  </div>

                  {/* SASU Side */}
                  <div className={`w-32 h-40 transition-all mr-8 duration-300 flex flex-col items-center ${selectedSide === 'SASU' ? 'opacity-100' : 'opacity-99 blur-sm'}`}>
                    <div className="w-32 h-32 flex items-center justify-center">
                      <Image
                        src={SIDES.SASU.image}
                        alt="SASU"
                        width={100}
                        height={100}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <span className="text-white font-bold text-lg mb-8">SASU</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Select Token</label>
                  <div className="flex gap-2">
                    {TOKEN_OPTIONS.map((token) => (
                      <button
                        key={token.id}
                        onClick={() => setSelectedToken(token.id as 'RARE' | 'BOD' | 'BOBER' | 'ONE' | 'TOM' | 'EGLD' | 'BATEMAN')}
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-all ${
                          selectedToken === token.id 
                            ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-black' 
                            : 'border-zinc-800 hover:border-[#C99733]'
                        }`}
                        title={`${token.name} (min: ${token.minAmount})`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={token.image}
                            alt={token.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      // Allow decimals but prevent multiple dots
                      const value = e.target.value;
                      if (value.split('.').length > 2) return; // Prevent multiple dots
                      if (value.startsWith('.')) return; // Prevent starting with dot
                      setAmount(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === 'e') {
                        e.preventDefault();
                      }
                    }}
                    step={selectedToken === 'EGLD' ? '0.01' : '1'}
                    min={TOKENS[selectedToken].minAmount}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white text-base font-medium placeholder-zinc-500 outline-none focus:border-[#C99733]"
                    placeholder="Enter amount"
                  />
                  {/* Helper message */}
                  <div className="text-sm text-zinc-500 mt-1">
                    Minimum amount: {TOKENS[selectedToken].minAmount} {selectedToken}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-sm mb-2">How many Battles to create?</label>
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
                  <label className="block text-zinc-400 text-sm mb-2">Pick your side</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedSide('GRM')}
                      className={`flex-1 h-16 rounded-xl ${
                        selectedSide === 'GRM' 
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                          : 'bg-zinc-800 text-white'
                      } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                        <Image
                          src={SIDES.GRM.image}
                          alt="GRM"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                      <span>GRM</span>
                    </button>
                    <button
                      onClick={() => setSelectedSide('SASU')}
                      className={`flex-1 h-16 rounded-xl ${
                        selectedSide === 'SASU' 
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-2 border-black text-black' 
                          : 'bg-zinc-800 text-white'
                      } font-medium transition-all flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#C99733] hover:to-[#FFD163] hover:text-black`}
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 p-1">
                          <Image
                            src={SIDES.SASU.image}
                            alt="SASU"
                            width={32}
                            height={32}
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <span className="ml-3">SASU</span>
                      </div>
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
                  {isLoadingBalance && selectedToken !== 'EGLD' ? (
                    <span className="text-zinc-400">Loading...</span>
                  ) : (
                    <span className="text-white font-medium">
                      {selectedToken === 'EGLD' 
                        ? (Number(account.balance) / Math.pow(10, 18)).toFixed(4)
                        : (selectedToken === 'RARE' ? rareBalance : 
                           selectedToken === 'BOD' ? bodBalance : 
                           selectedToken === 'BOBER' ? boberBalance : 
                           selectedToken === 'ONE' ? oneBalance :
                           selectedToken === 'TOM' ? tomBalance :
                           0).toFixed(2)} {selectedToken}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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