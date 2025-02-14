"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';
import Image from 'next/image';

interface WheelMultiplier {
  value: string;
  multiplier: number;
  color: string;
  pattern: string;
}

interface RareOption {
  value: number;
  label: string;
}

const multipliers: WheelMultiplier[] = [
  { value: '100x', multiplier: 100, color: '#BF9129', pattern: '🌟' },
  { value: '10x', multiplier: 10, color: '#D1A23B', pattern: '💫' },
  { value: '5x', multiplier: 5, color: '#E6B84D', pattern: '🚀' },
  { value: '3x', multiplier: 3, color: '#FFD163', pattern: '⭐' },
  { value: '1x', multiplier: 1, color: '#C99733', pattern: '🌠' },
  { value: '0x', multiplier: 0, color: '#4A4A4A', pattern: '☄️' }
];

const rareOptions: RareOption[] = [
  { value: 500, label: '500 RARE' },
  { value: 5000, label: '5,000 RARE' },
  { value: 20000, label: '20,000 RARE' }
];

export function WheelOfFomo() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelMultiplier | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<RareOption>(rareOptions[0]);

  const spinWheel = () => {
    if (spinning) return;
    
    setSpinning(true);
    setResult(null);
    
    const sectionAngle = 360 / multipliers.length;
    const randomSection = Math.floor(Math.random() * multipliers.length);
    const randomSpins = 10 + Math.floor(Math.random() * 5);
    const targetRotation = randomSpins * 360 + ((multipliers.length - randomSection) * sectionAngle);
    
    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      const resultIndex = randomSection;
      setResult(multipliers[resultIndex]);
    }, 20000);
  };

  const calculateWinAmount = (amount: number, multiplier: number): string => {
    if (multiplier === 0) return '0';
    const winAmount = BigInt(amount) * BigInt(multiplier);
    return winAmount.toLocaleString();
  };

  const getDisplayAmount = (amount: number, multiplier: number): string => {
    if (multiplier === 0) return '0';
    return calculateWinAmount(amount, multiplier);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 md:p-8 pt-20 overflow-x-hidden">
      <div className="w-full max-w-5xl bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl p-4 md:p-8 relative border border-zinc-800 shadow-xl">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Top section - Currency and Mode Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1 w-full">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Wheel of Fomo</h2>
              
              {/* Currency Selector */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Currency</label>
                <div className="w-full flex items-center justify-between bg-black/30 p-3 rounded-xl text-white border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg`}
                      alt="RARE"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span>RARE</span>
                  </div>
                </div>
              </div>

              {/* Wheel Mode Toggle */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Wheel mode</label>
                <div className="grid grid-cols-3 gap-2 bg-black/30 p-2 rounded-xl border border-zinc-800">
                  {rareOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedAmount(option)}
                      className={cn(
                        "px-1 md:px-4 py-2 rounded-xl text-white transition-all text-xs md:text-base whitespace-nowrap",
                        selectedAmount.value === option.value
                          ? "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black"
                          : "hover:bg-zinc-800"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Wheel and Spin Button - Right Column */}
            <div className="space-y-6 order-1 lg:order-2 w-full">
              <div className="relative w-full aspect-square max-w-[300px] md:max-w-[400px] mx-auto">
                <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-[#C99733]">
                  <motion.div
                    className="absolute w-full h-full"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 20, ease: [0.2, 0.6, 0.3, 1] }}
                    style={{ transformOrigin: "center center" }}
                  >
                    {multipliers.map((multiplier, index) => {
                      const rotation = index * (360 / multipliers.length);
                      const skewAngle = 90 - (360 / multipliers.length);
                      
                      return (
                        <div
                          key={multiplier.value}
                          className="absolute w-1/2 h-1/2 origin-bottom-right"
                          style={{
                            transform: `rotate(${rotation}deg) skew(${skewAngle}deg)`,
                            background: multiplier.color,
                            borderRight: '2px solid rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                              transform: `skew(${-skewAngle}deg) rotate(${-rotation - 60}deg)`,
                              width: '100px',
                              textAlign: 'center',
                            }}
                          >
                            <div className="text-xl md:text-2xl mb-1">{multiplier.pattern}</div>
                            <span className="text-lg md:text-xl font-bold text-white">{multiplier.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Center decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 md:w-16 h-12 md:h-16 rounded-full bg-[#C99733] shadow-lg flex items-center justify-center z-10">
                  <div className="w-9 md:w-12 h-9 md:h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-[#C99733]"></div>
                  </div>
                </div>

                {/* Arrow pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[12px] md:border-l-[15px] border-r-[12px] md:border-r-[15px] border-t-[20px] md:border-t-[25px] border-l-transparent border-r-transparent border-t-red-600" />
                </div>
              </div>

              <button
                onClick={spinWheel}
                disabled={spinning}
                className={cn(
                  "w-full py-3 md:py-4 text-lg md:text-xl font-semibold rounded-xl transition-all",
                  "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:opacity-90"
                )}
              >
                {spinning ? 'Spinning...' : 'Spin Now'}
              </button>
            </div>
          </div>

          {/* Bottom section - Tiers */}
          <div className="border-t border-[#C99733]/20 pt-4 md:pt-6 w-full">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Possible Winnings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {multipliers.map((multiplier, index) => (
                <div key={index} className="flex items-center gap-2 bg-black/30 px-2 md:px-4 py-2 rounded-xl border border-zinc-800">
                  <div className="w-4 md:w-6 h-4 md:h-6 rounded-full flex-shrink-0" style={{ background: multiplier.color }} />
                  <div className="flex items-center gap-1">
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg`}
                      alt="RARE"
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-white text-xs md:text-sm truncate">
                      {getDisplayAmount(selectedAmount.value, multiplier.multiplier)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1A1A] p-8 rounded-xl border border-[#C99733] shadow-xl w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-4xl font-bold text-[#C99733] mb-2">
                  {result.value}
                </h3>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 