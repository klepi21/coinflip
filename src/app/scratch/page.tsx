'use client';

import { ScratchToReveal } from "@/components/ui/scratch-to-reveal";
import { motion } from "framer-motion";
import { FaCoins, FaDollarSign, FaRedo } from "react-icons/fa";
import { useEffect, useState } from "react";

// Non-beaver emojis
const otherAnimals = ['🐂', '🐻', '🐕', '🐈'];

interface Prize {
  id: number;
  isRevealed: boolean;
  animal: string;
}

const BEAVER_PROBABILITY = 0.2; // 20% chance for beaver
const PRIZES = {
  0: 0,
  1: 2,
  2: 5,
  3: 20,
  4: 100,
  5: 1000
};

export default function ScratchPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [beaverCount, setBeaverCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const generateNewGame = () => {
    // Generate prizes with 20% chance of beaver for each slot
    const newPrizes = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      isRevealed: false,
      animal: Math.random() < BEAVER_PROBABILITY 
        ? '🦫' 
        : otherAnimals[Math.floor(Math.random() * otherAnimals.length)]
    }));
    setPrizes(newPrizes);
    setRevealedCount(0);
    setBeaverCount(0);
    setIsComplete(false);
    setTicketNumber(Math.floor(Math.random() * 9999).toString().padStart(4, '0'));
  };

  useEffect(() => {
    generateNewGame();
  }, []);

  const handleComplete = (id: number) => {
    const prize = prizes.find(p => p.id === id);
    if (!prize || prize.isRevealed) return;

    const newRevealedCount = revealedCount + 1;
    
    // Update revealed status
    setPrizes(prev => prev.map(p => 
      p.id === id ? { ...p, isRevealed: true } : p
    ));

    setRevealedCount(newRevealedCount);
    
    if (prize.animal === '🦫') {
      setBeaverCount(prev => prev + 1);
    }

    // Check if all areas are revealed
    if (newRevealedCount === 5) {
      setIsComplete(true);
    }
  };

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
      100: "🎉 Amazing win! ($100)",
      1000: "🎊 JACKPOT! YOU WON $1,000! 🎊"
    };
    
    return messages[prize as keyof typeof messages] || `You won $${prize}!`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-black/90 pt-24">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="flex items-center gap-1 text-lg font-bold text-white">
                <FaDollarSign className="text-yellow-400" />2
              </span>
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white drop-shadow-lg">
              Lucky Coins
            </h1>
            <p className="text-sm text-white/80">Find the beaver (🦫) to win!</p>
            <div className="mt-2 space-y-1 text-xs text-yellow-400">
              <p>1 Beaver: $2 | 2 Beavers: $5 | 3 Beavers: $20</p>
              <p>4 Beavers: $100 | 5 Beavers: $1,000!</p>
            </div>
          </div>

          {/* Scratch Areas */}
          <div className="flex flex-wrap justify-center gap-4">
            {prizes.map((prize) => (
              <div key={prize.id} className="relative">
                <ScratchToReveal
                  width={180}
                  height={120}
                  className="overflow-hidden rounded-xl border-2 border-white/10 bg-gradient-to-br from-gray-700 to-gray-800"
                  onComplete={() => handleComplete(prize.id)}
                  gradientColors={["#C0C0C0", "#E0E0E0", "#A0A0A0"]}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <span className="text-4xl">{prize.animal}</span>
                  </div>
                </ScratchToReveal>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 text-2xl font-bold ${
                isComplete && getCurrentPrize() > 0 ? 'text-yellow-400' : 'text-white'
              }`}
            >
              {getPrizeMessage()}
            </motion.div>
            {isComplete && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={generateNewGame}
                className="mb-6 inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black transition-colors hover:bg-yellow-400"
              >
                <FaRedo className="h-4 w-4" />
                Play Again
              </motion.button>
            )}
            <div className="text-xs text-white/40">
              <p>Ticket #{ticketNumber}</p>
              <p>Must be 18 or older to play. Void where prohibited.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 