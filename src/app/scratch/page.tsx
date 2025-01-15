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

// Non-beaver emojis
const otherAnimals = ['🐂', '🐄', '🐕', '🐈'];

// BOD image URLs
const BOD_SOLO_URL = 'https://bod.gg/assets/bod-solo2-CEyg0yC7.svg';
const BOD_FULL_URL = 'https://bod.gg/assets/bod-DinfoILb.svg';

// Add at the top with other constants
const USER_EMOJIS = ['👨', '👩', '🧑', '👱', '👴', '👵', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳'];

interface Prize {
  id: number;
  isRevealed: boolean;
  animal: string;
  isBod: boolean; // Add this to track if it's a BOD image
}

const BEAVER_PROBABILITY = 0.2; // 20% chance for beaver
const PRIZES = {
  0: 0,
  1: 2,
  2: 5,
  3: 20,
  4: 100
};

const RECEIVER_ADDRESS = 'erd1z4wpx7v2q2a4e0cppcf9y6jp8z4cuttycr5uzne2nl0pww3054ssf4jkh5';

const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  }
};

export default function ScratchPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [beaverCount, setBeaverCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    address: string;
    amount?: number;
    type: 'win' | 'purchase';
    timestamp: number;
    userEmoji: string;
    row: number;
    column: number;
  }>>([]);

  const generateNewGame = () => {
    const newPrizes = Array.from({ length: 4 }, (_, i) => {
      const isBod = Math.random() < BEAVER_PROBABILITY;
      return {
        id: i + 1,
        isRevealed: false,
        animal: isBod ? BOD_SOLO_URL : otherAnimals[Math.floor(Math.random() * otherAnimals.length)],
        isBod
      };
    });
    setPrizes(newPrizes);
    setRevealedCount(0);
    setBeaverCount(0);
    setIsComplete(false);
    setTicketNumber(Math.floor(Math.random() * 9999).toString().padStart(4, '0'));
  };

  const handleBuyScratch = async () => {
    try {
      setIsSubmitting(true);
      setIsWaitingForTx(true);

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [{
          value: "1000000000000000", // 0.001 EGLD
          data: "buyScratch",
          receiver: RECEIVER_ADDRESS,
          gasLimit: 50000000,
        }],
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
      setIsWaitingForTx(false);
    } finally {
      setIsSubmitting(false);
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
      setBeaverCount(prev => prev + 1);
    }
  };

  // Move completion check to a proper useEffect
  useEffect(() => {
    if (revealedCount === 4 && !isComplete) {
      setIsComplete(true);
      const finalPrize = PRIZES[beaverCount as keyof typeof PRIZES] || 0;
      
      if (finalPrize > 0) {
        // Trigger confetti for wins
        const duration = finalPrize >= 20 ? 8000 : 4000; // Longer celebration for bigger wins
        const particleCount = finalPrize >= 20 ? 200 : 100;
        
        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 }
        });

        // For bigger wins, add more confetti bursts
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
    }
  }, [revealedCount, beaverCount, isComplete]);

  const getCurrentPrize = () => PRIZES[beaverCount as keyof typeof PRIZES] || 0;

  const getPrizeMessage = () => {
    if (!isComplete) {
      if (beaverCount > 0) {
        return `Found ${beaverCount} beaver${beaverCount > 1 ? 's' : ''}! Keep scratching...`;
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
    setHasPurchased(false); // Reset to purchase screen
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

  useEffect(() => {
    // Initialize notifications in a grid
    const initialNotifications = [];
    const rows = 5;
    const columns = 5;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const isWin = Math.random() > 0.4; // 60% chance for wins
        initialNotifications.push({
          id: Date.now() + Math.random(),
          address: `erd1${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}`,
          amount: isWin ? Math.floor(Math.random() * 496) + 5 : undefined,
          type: isWin ? ('win' as const) : ('purchase' as const),
          timestamp: Date.now() - Math.floor(Math.random() * 30000),
          userEmoji: USER_EMOJIS[Math.floor(Math.random() * USER_EMOJIS.length)],
          row,
          column: col
        });
      }
    }
    setNotifications(initialNotifications);

    // Replace random notifications periodically
    const interval = setInterval(() => {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * columns);
      const isWin = Math.random() > 0.4;

      setNotifications(prev => prev.map(notif => {
        if (notif.row === row && notif.column === col) {
          return {
            id: Date.now() + Math.random(),
            address: `erd1${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}`,
            amount: isWin ? Math.floor(Math.random() * 496) + 5 : undefined,
            type: isWin ? ('win' as const) : ('purchase' as const),
            timestamp: Date.now(),
            userEmoji: USER_EMOJIS[Math.floor(Math.random() * USER_EMOJIS.length)],
            row,
            column: col
          };
        }
        return notif;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isWaitingForTx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black/90">
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl"
          >
            <img src={BOD_FULL_URL} alt="BOD" className="h-36 w-36" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <h2 className="mb-2 text-2xl font-bold text-white">Preparing Your Scratch Ticket</h2>
            <p className="text-[#FD8700]">Transaction in progress...</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-[#FD8700]"
              />
              <motion.div
                animate={{
                  scale: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.2,
                }}
                className="h-2 w-2 rounded-full bg-[#FD8700]"
              />
              <motion.div
                animate={{
                  scale: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.4,
                }}
                className="h-2 w-2 rounded-full bg-[#FD8700]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-black/95 overflow-hidden">
        {/* Background Grid of Notifications */}
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          <div className="relative grid grid-rows-5 gap-4 p-8">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-4">
                {notifications
                  .filter(n => n.row === rowIndex)
                  .sort((a, b) => a.column - b.column)
                  .map((notification) => {
                    const isRecent = Date.now() - notification.timestamp < 2000;
                    const isWin = notification.type === 'win';
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-48"
                      >
                        <motion.div
                          animate={{
                            opacity: isRecent ? [0, 0.8] : 0.4
                          }}
                          transition={{
                            duration: 1
                          }}
                        >
                          <div className={`h-32 rounded-xl p-4 shadow-xl backdrop-blur-lg border ${
                            isWin 
                              ? 'bg-gradient-to-br from-zinc-900/60 to-zinc-800/60 border-zinc-700/30' 
                              : 'bg-gradient-to-br from-purple-900/60 to-purple-800/60 border-purple-700/30'
                          }`}>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  isWin 
                                    ? 'bg-green-500/5' 
                                    : 'bg-purple-500/5'
                                }`}>
                                  <span className="text-xl opacity-70">{notification.userEmoji}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs text-zinc-400/70">
                                    {notification.address}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    isWin
                                      ? isRecent 
                                        ? 'text-yellow-400/90 font-bold'
                                        : 'text-green-500/70'
                                      : 'text-purple-400/70'
                                  }`}>
                                    {isWin 
                                      ? isRecent
                                        ? `JUST WON $${notification.amount}!`
                                        : `Won $${notification.amount}`
                                      : 'Purchased a ticket'}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-zinc-500/50">
                                {getTimeAgo(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Button Card - Added stronger blur and glow */}
        <div className="relative z-20 w-full max-w-md px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 p-8 shadow-2xl border border-zinc-800/80 backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-zinc-900/20 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative">
              <h1 className="mb-6 text-center text-3xl font-bold text-white drop-shadow-lg">BOD Jackpot</h1>
              <div className="mb-8 space-y-2 text-center">
                <p className="text-zinc-400">Try your luck with our scratch game!</p>
                <p className="text-sm text-zinc-500">Only 0.001 EGLD per ticket</p>
              </div>
              <button
                onClick={handleBuyScratch}
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-4 font-bold text-white shadow-lg transition-all hover:from-zinc-800 hover:to-zinc-700 disabled:opacity-50 border border-zinc-700/50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <img src={BOD_SOLO_URL} alt="BOD" className="h-12 w-12" />
                    <span className="text-lg">Buy & Scratch</span>
                  </div>
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-yellow-600/0 via-yellow-600/10 to-yellow-600/0 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black/90">
      <div className="w-full max-w-4xl px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 p-8 shadow-2xl border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-zinc-900/10 backdrop-blur-xl" />
          
          {/* Header */}
          <div className="relative mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white drop-shadow-lg">
              BOD Jackpot
            </h1>
            <p className="text-sm text-zinc-400">Find BOD to win!</p>
            <div className="mt-2 space-y-1 text-xs text-[#FD8700]">
              <p>1 BOD: $2 | 2 BODs: $5</p>
              <p>3 BODs: $20 | 4 BODs: $100</p>
            </div>
          </div>

          {/* Scratch Areas */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {prizes.map((prize) => (
              <div key={prize.id} className="relative">
                <ScratchToReveal
                  width={180}
                  height={120}
                  className="overflow-hidden rounded-2xl border border-[#FD8700]/30 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90"
                  onComplete={() => handleComplete(prize.id)}
                  gradientColors={["#18181B", "#27272A", "#3F3F46"]}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900/90 to-zinc-800/90">
                    {prize.isBod ? (
                      <img src={prize.animal} alt="BOD" className="h-16 w-16" />
                    ) : (
                      <span className="text-4xl">{prize.animal}</span>
                    )}
                  </div>
                </ScratchToReveal>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="relative mt-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 text-2xl font-bold ${
                isComplete && getCurrentPrize() > 0 ? 'text-[#FD8700]' : 'text-white'
              }`}
            >
              {getPrizeMessage()}
            </motion.div>
            <div className="text-xs text-zinc-500">
              <p>Ticket #{ticketNumber}</p>
              <p>Must be 18 or older to play. Void where prohibited.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Popup */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
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
                      animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="mb-4 flex flex-col items-center gap-4"
                    >
                      <div className="rounded-full bg-[#FD8700] p-4">
                        <FaTrophy className="h-8 w-8 text-black" />
                      </div>
                      <img src={BOD_FULL_URL} alt="BOD" className="h-48 w-48" />
                    </motion.div>
                    <h2 className="mb-2 text-3xl font-bold text-[#FD8700]">
                      Congratulations!
                    </h2>
                    <p className="mb-4 text-xl text-white">
                      You won ${getCurrentPrize()}!
                    </p>
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
                    <h2 className="mb-2 text-3xl font-bold text-zinc-300">
                      Better Luck Next Time!
                    </h2>
                    <p className="mb-4 text-zinc-400">
                      Try again for another chance to win
                    </p>
                  </>
                )}
                <button
                  onClick={handleClosePopup}
                  className="rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:from-zinc-700 hover:to-zinc-600 border border-zinc-600/50"
                >
                  Buy New Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 