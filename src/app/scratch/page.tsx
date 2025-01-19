'use client';

import { ScratchToReveal } from "@/components/ui/scratch-to-reveal";
import { motion, AnimatePresence } from "framer-motion";
import { FaCoins, FaDollarSign, FaTrophy, FaTimes, FaTicketAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import confetti from 'canvas-confetti';
import Image from "next/image";
import { useAudio } from '@/hooks/useAudio';
import { useWallet } from '@/context/WalletContext';
import { cn } from "@/lib/utils";
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { Address, TokenTransfer, Transaction, TransactionPayload } from '@multiversx/sdk-core';
import { GameNotifications } from '@/components/ui/game-notifications';

// Non-beaver emojis
const otherTokens = ['BOBER', 'KWAK', 'GLONK'];

// BOD image URLs
const BOD_SOLO_URL = 'https://bod.gg/assets/bod-solo2-CEyg0yC7.svg';
const BOD_FULL_URL = 'https://bod.gg/assets/bod-DinfoILb.svg';

// Add at the top with other constants
const USER_EMOJIS = ['👨', '👩', '🧑', '👱', '👴', '👵', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳'];
const TOKEN_IMAGES = {
  BOD: 'https://bod.gg/assets/bod-solo2-CEyg0yC7.svg',
  BOBER: 'https://tools.multiversx.com/assets-cdn/tokens/BOBER-9eb764/icon.png',
  KWAK: 'https://tools.multiversx.com/assets-cdn/tokens/KWAK-469ab0/icon.png',
  GLONK: 'https://tools.multiversx.com/assets-cdn/tokens/GLONK-9961fb/icon.svg'
};

interface Prize {
  id: number;
  isRevealed: boolean;
  token: string;
  isBod: boolean; // Add this to track if it's a BOD image
}

const BEAVER_PROBABILITY = 0.2; // 20% chance for beaver
const PRIZES = {
  0: 0,
  1: 2,
  2: 5,
  3: 100
};

const RECEIVER_ADDRESS = 'erd1z4wpx7v2q2a4e0cppcf9y6jp8z4cuttycr5uzne2nl0pww3054ssf4jkh5';

const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgq8dcdymtj8a3wu92z6w25gjw72swnte2zu7zs6cvd7y';
const USDC_IDENTIFIER = 'USDC-350c4e';
const AMOUNTS = [1, 5, 10]; // USDC amounts

const toHexEven = (num: number) => {
  // Convert to hex and remove '0x' prefix
  let hex = (num).toString(16);
  // Ensure even length by padding with 0 if needed
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return hex;
};

export default function ScratchPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [bodCount, setBodCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const scratchSound = useAudio('/sounds/scra.m4a');
  const { isLoggedIn, address } = useWallet();
  const [isGameFinished, setIsGameFinished] = useState(false);
  const { balance: usdcBalance, isLoading: isLoadingBalance } = useTokenBalance(address, USDC_IDENTIFIER);
  const [elapsedTime, setElapsedTime] = useState(0);

  const generateNewGame = () => {
    const newPrizes = Array.from({ length: 3 }, (_, i) => {
      const isBod = Math.random() < BEAVER_PROBABILITY;
      return {
        id: i + 1,
        isRevealed: false,
        token: isBod ? 'BOD' : otherTokens[Math.floor(Math.random() * otherTokens.length)],
        isBod
      };
    });
    setPrizes(newPrizes);
    setRevealedCount(0);
    setBodCount(0);
    setIsComplete(false);
    setTicketNumber(Math.floor(Math.random() * 9999).toString().padStart(4, '0'));
  };

  const handleBuyScratch = async () => {
    try {
      setIsSubmitting(true);
      setIsWaitingForTx(true);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Create ESDT transfer transaction
      const tx = new Transaction({
        value: 0,
        data: new TransactionPayload(`ESDTTransfer@${Buffer.from(USDC_IDENTIFIER).toString('hex')}@${(selectedAmount * Math.pow(10, 6)).toString(16).padStart(16, '0')}@${Buffer.from('buy').toString('hex')}`),
        receiver: new Address(SC_ADDRESS),
        sender: new Address(address),
        gasLimit: 20000000,
        chainID: 'D'
      });

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing scratch ticket purchase',
          errorMessage: 'An error occurred during purchase',
          successMessage: 'Scratch ticket purchased successfully'
        }
      });
      
      if (newSessionId) {
        setSessionId(newSessionId);
      }

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase scratch ticket');
      setIsSubmitting(false);
      setIsWaitingForTx(false);
    }
  };

  useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: () => {
      setHasPurchased(true);
      setIsWaitingForTx(false);
      generateNewGame();
      toast.success('Successfully purchased scratch ticket!');
    },
    onFail: (errorMessage) => {
      toast.error(`Transaction failed: ${errorMessage}`);
      setIsWaitingForTx(false);
    },
  });

  const handleComplete = (id: number) => {
    const prize = prizes.find(p => p.id === id);
    if (!prize || prize.isRevealed) return;

    const newRevealedCount = revealedCount + 1;
    
    setPrizes(prev => prev.map(p => 
      p.id === id ? { ...p, isRevealed: true } : p
    ));

    setRevealedCount(newRevealedCount);
    
    if (prize.isBod) {
      setBodCount(prev => prev + 1);
    }

    if (newRevealedCount === 3) {
      setIsGameFinished(true);
      setTimeout(() => {
        setIsComplete(true);
        const finalPrize = PRIZES[bodCount as keyof typeof PRIZES] || 0;
        
        if (finalPrize > 0) {
          confetti({
            particleCount: finalPrize >= 20 ? 200 : 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          if (finalPrize >= 20) {
            setTimeout(() => {
              confetti({
                particleCount: 100,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
              });
              confetti({
                particleCount: 100,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
              });
            }, 1000);
          }
        }
      }, 1000);
    }
  };

  const getCurrentPrize = () => PRIZES[bodCount as keyof typeof PRIZES] || 0;

  const getPrizeMessage = () => {
    if (!isComplete && !isGameFinished) {
      if (bodCount > 0) {
        return "Keep scratching...";
      }
      return "Scratch to reveal your prizes!";
    }

    const prize = getCurrentPrize();
    if (prize === 0) return "Better luck next time!";
    
    const messages = {
      2: "Got your money back! ($2)",
      5: "Nice win! ($5)",
      20: "Great win! ($20)",
      100: "🎉 JACKPOT! YOU WON $100! 🎉"
    };
    
    return messages[prize as keyof typeof messages] || `You won $${prize}!`;
  };

  const handleClosePopup = () => {
    setIsComplete(false);
  };

  const getRandomScreenPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    // Get full screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate padding to keep notifications away from edges
    const padding = 200;
    
    // Get random position within padded area
    return {
      x: padding + Math.random() * (screenWidth - padding * 2),
      y: padding + Math.random() * (screenHeight - padding * 2)
    };
  };

  const handleScratchStart = () => {
    scratchSound.play();
  };

  const getButtonState = () => {
    if (!isLoggedIn) return { disabled: true, message: null };
    if (isSubmitting) return { disabled: true, message: null };
    if (isLoadingBalance) return { disabled: true, message: 'Loading balance...' };
    if (usdcBalance === 0) return { disabled: true, message: 'No USDC tokens in wallet' };
    if (usdcBalance < selectedAmount) return { 
      disabled: true, 
      message: `Insufficient USDC balance (${usdcBalance.toFixed(2)} USDC available)`
    };
    return { disabled: false, message: null };
  };

  const buttonState = getButtonState();

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

  if (isWaitingForTx) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FD8700] to-[#FFA036] overflow-hidden">
        <div className="relative">
          <motion.div
            animate={{
              x: [-100, 400],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatType: "reverse"
            }}
            className="text-6xl relative z-10"
          >
            <img src={BOD_FULL_URL} alt="BOD" className="h-36 w-36" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center relative z-10"
          >
            <h2 className="mb-2 text-2xl font-bold text-black font-doggie">
              Preparing Your Scratch Ticket
            </h2>
            <div className="text-black/80 font-doggie">Transaction in progress...</div>
            
            <div className="mt-2 text-black/60 font-doggie">
              Time elapsed: {elapsedTime}s
            </div>
            
            <div className="mt-4 px-4 py-3 rounded-lg bg-[#FFA036]/20 border-2 border-black">
              <div className="text-black font-doggie text-sm font-bold flex items-center justify-center gap-2">
                <span className="text-xl">⚠️</span>
                Please don't close or refresh the page or you may lose your scratch!
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="relative flex min-h-screen flex-col items-center bg-gradient-to-br from-[#FD8700] to-[#FFA036] overflow-hidden pb-36">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-4 py-24 relative z-10">
          {/* Stats Boxes */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Total Scratched Box */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-[#FD8803] p-6 shadow-2xl border-2 border-black backdrop-blur-xl"
            >
              <div className="relative text-center">
                <h2 className="text-xl font-bold text-black font-doggie mb-2">
                  total scratched tickets
                </h2>
                <div className="text-3xl font-bold text-black font-doggie">
                  1,560
                </div>
              </div>
            </motion.div>

            {/* Jackpot Box */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-[#FD8803] p-6 shadow-2xl border-2 border-black backdrop-blur-xl"
            >
              <div className="relative text-center">
                <h2 className="text-xl font-bold font-doggie mb-2 text-black">
                  jackpot
                </h2>
                <div className="text-3xl font-bold text-black font-doggie">
                  30,456,765 $BOD
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Game Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden rounded-3xl bg-[#FD8803] p-8 pb-12 shadow-2xl border-2 border-black backdrop-blur-xl"
          >
            <div className="relative">
              <h1 className="mb-6 text-center text-3xl font-bold text-black drop-shadow-lg font-doggie">
                scratch BOD
              </h1>
              <div className="mb-8 space-y-2 text-center font-doggie">
                <p className="text-lg text-black">
                  select an amount and try your luck!
                </p>
              </div>

              <div className="mt-4 space-y-8">
                <div className="flex justify-center gap-4">
                  {AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={cn(
                        "px-6 py-3 rounded-full font-doggie text-xl transition-all duration-300 border-2",
                        selectedAmount === amount 
                          ? "bg-[#FFA036] text-black border-black" 
                          : "bg-black/20 text-white/80 border-white/20 hover:bg-black/30"
                      )}
                    >
                      {amount} USDC
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleBuyScratch}
                  disabled={buttonState.disabled}
                  className={`w-full relative group font-doggie
                    ${!buttonState.disabled 
                      ? 'bg-[#FFA036] hover:bg-[#FFA036]/80' 
                      : 'bg-[#FFA036]/50 cursor-not-allowed'
                    }
                    text-black rounded-full px-8 py-4 font-semibold transition-all duration-300
                    border-2 border-black`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-black" />
                      <span className="text-black">Processing...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <img src={BOD_SOLO_URL} alt="BOD" className="h-14 w-14 top-1 left-14 absolute " />
                        <span className="text-xl text-black font-bold ml-8">
                          {isLoggedIn ? `buy & scratch` : 'login to play'}
                        </span>
                      </div>
                      
                      {/* Balance/Error Message */}
                      {buttonState.message && (
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 
                                      bg-black text-white px-4 py-2 rounded-lg text-sm font-doggie
                                      whitespace-nowrap pointer-events-none">
                          {buttonState.message}
                        </div>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Game Notifications */}
        <div className="relative z-20">
          <GameNotifications />
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 text-center bg-[#FD8700]/90 backdrop-blur-lg">
          <div className="text-black font-doggie text-xl">
            Must be 18 or older to play. Void where prohibited.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FD8700] to-[#FFA036]">
      <div className="w-full max-w-4xl px-4 relative z-10 pt-24 md:pt-0">
        {/* Enhanced background layers */}
        <div className="fixed inset-0 bg-black/30" /> {/* Dark overlay */}
        <div className="fixed inset-0 bg-white/5 pattern-grid-white/5" />
        
        {/* Modern lottery ticket container */}
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/80 to-zinc-900/90 p-4 md:p-8 shadow-2xl border border-white/20">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FD8700] via-[#FFA036] to-[#FD8700]" />
          
          {/* Header with enhanced styling */}
          <div className="relative mb-4 md:mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2 md:mb-4">
              <img src={BOD_SOLO_URL} alt="BOD" className="h-12 w-12 md:h-16 md:w-16" />
              <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-[#FD8700] to-[#FFA036] font-doggie">
                Scratch BOD
              </h1>
            </div>
            <div className="text-sm text-zinc-400 font-doggie">find 3 matching symbols to win!</div>
            <div className="mt-4 inline-block px-6 py-2 rounded-full bg-black/40 border border-white/10">
              <div className="space-y-1 text-xs font-medium font-doggie">
                <div className="text-[#FD8700]">1 BOD: $2 | 2 BODs: $5</div>
                <div className="text-[#FFA036]">3 BODs: $20 | 4 BODs: $100</div>
              </div>
            </div>
          </div>

          {/* Scratch areas with enhanced styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-3 md:p-6 rounded-2xl bg-black/40 border border-white/10">
            {prizes.map((prize) => (
              <div key={prize.id} className="relative group mx-auto w-full max-w-[160px] md:max-w-[180px] touch-none">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FD8700] to-[#FFA036] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                <ScratchToReveal
                  width={160}
                  height={100}
                  className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#FFA036]/90 to-[#FD8700]/90 touch-none"
                  onComplete={() => handleComplete(prize.id)}
                  onScratchStart={handleScratchStart}
                  gradientColors={["#FD8700", "#FFA036", "#FD8700"]}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900/90 to-zinc-800/90">
                    {prize.isRevealed ? (
                      <img 
                        src={TOKEN_IMAGES[prize.token as keyof typeof TOKEN_IMAGES]} 
                        alt={prize.token} 
                        className="h-16 w-16 drop-shadow-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-black/40" />
                    )}
                  </div>
                </ScratchToReveal>
              </div>
            ))}
          </div>

          {/* Play Again button - show when game is finished */}
          {isGameFinished && (
            <div className="flex justify-center w-full">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setIsGameFinished(false);
                  setIsComplete(false);
                  setHasPurchased(false);
                  setIsSubmitting(false);
                }}
                className="mt-8 px-8 py-4 bg-[#FFA036] hover:bg-[#FFA036]/80 
                          text-black rounded-full font-semibold transition-all 
                          duration-300 border-2 border-black font-doggie"
              >
                Play Again
              </motion.button>
            </div>
          )}

          {/* Footer with ticket info */}
          <div className="relative mt-4 md:mt-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 text-2xl font-bold font-doggie ${
                isComplete && getCurrentPrize() > 0 ? 'text-[#FD8700]' : 'text-white'
              }`}
            >
              {getPrizeMessage()}
            </motion.div>
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
              <div className="px-4 py-2 rounded-full bg-black/40 border border-white/10">
                Ticket #{ticketNumber}
              </div>
              <div className="opacity-60">Must be 18 or older to play. Void where prohibited.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal - now appears after delay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleClosePopup}
            />
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="relative rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 p-8 text-center shadow-2xl border border-zinc-700/50"
            >
              <button
                onClick={handleClosePopup}
                className="absolute right-4 top-4 rounded-full bg-zinc-800/50 p-2 text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-white"
              >
                <FaTimes className="h-4 w-4" />
              </button>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-800/10 to-zinc-900/10 backdrop-blur-xl" />
              <div className="relative">
                {getCurrentPrize() > 0 ? (
                  <>
                    <motion.div
                      animate={{ x: [-20, 20, -20] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="mb-4 flex flex-col items-center gap-4"
                    >
                      <div className="rounded-full bg-[#FD8700] p-4">
                        <FaTrophy className="h-8 w-8 text-black" />
                      </div>
                      <img src={BOD_FULL_URL} alt="BOD" className="h-48 w-48" />
                    </motion.div>
                    <h2 className="mb-2 text-3xl font-bold text-[#FD8700] font-doggie">
                      Congratulations!
                    </h2>
                    <div className="mb-4 text-xl text-white font-doggie">
                      You won ${getCurrentPrize()}!
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1 }}
                      className="mb-4 inline-block rounded-full bg-zinc-800/50 p-4"
                    >
                      <FaCoins className="h-8 w-8 text-[#FD8700]/50" />
                    </motion.div>
                    <h2 className="mb-2 text-3xl font-bold text-zinc-300 font-doggie">
                      Better Luck Next Time!
                    </h2>
                    <div className="mb-4 text-zinc-400 font-doggie">
                      Try again for another chance to win
                    </div>
                  </>
                )}
                <button
                  onClick={handleClosePopup}
                  className="rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:from-zinc-700 hover:to-zinc-600 border border-zinc-600/50 font-doggie"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 