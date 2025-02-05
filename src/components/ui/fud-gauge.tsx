'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FudGaugeProps {
  value: number;
  size?: number;
  animated?: boolean;
}

const getSentiment = (value: number) => {
  if (value <= 20) return 'Xtreme FUD';
  if (value <= 40) return 'FUD';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'FOMO';
  return 'Xtreme FOMO';
};

const getColor = (value: number) => {
  if (value <= 20) return '#e74c3c';  // Red for Extreme FUD
  if (value <= 40) return '#e67e22';  // Orange for FUD
  if (value <= 60) return '#f1c40f';  // Yellow for Neutral
  if (value <= 80) return '#2ecc71';  // Light green for FOMO
  return '#27ae60';                   // Dark green for Extreme FOMO
};

export function FudGauge({ value = 50, size = 300, animated = true }: FudGaugeProps) {
  const [currentValue, setCurrentValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      setCurrentValue(0);
      const timeout = setTimeout(() => setCurrentValue(value), 100);
      return () => clearTimeout(timeout);
    } else {
      setCurrentValue(value);
    }
  }, [value, animated]);

  const rotation = (currentValue * 180) / 100;
  const sentiment = getSentiment(currentValue);
  const currentColor = getColor(currentValue);

  return (
    <div className="relative" style={{ width: size, height: size / 1.5 }}>
      {/* Background Arc */}
      <svg
        viewBox="0 0 200 100"
        className="w-full"
        style={{ transform: 'rotate(0deg)' }}
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#e74c3c' }} />
            <stop offset="25%" style={{ stopColor: '#e67e22' }} />
            <stop offset="50%" style={{ stopColor: '#f1c40f' }} />
            <stop offset="75%" style={{ stopColor: '#2ecc71' }} />
            <stop offset="100%" style={{ stopColor: '#27ae60' }} />
          </linearGradient>
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#C99733' }} />
            <stop offset="100%" style={{ stopColor: '#FFD163' }} />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle 
          cx="100" 
          cy="90" 
          r="85" 
          fill="#1A1A1A" 
          className="opacity-95"
        />

        {/* Main Gauge Arc */}
        <path
          d="M20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          className="opacity-80"
        />

        {/* Labels */}
        <text x="10" y="100" className="text-[10px] fill-zinc-400 font-medium mt-10">FUD</text>
        <text x="170" y="100" className="text-[10px] fill-zinc-400 font-medium mt-2">FOMO</text>

        {/* Value Text */}
        <text
          x="100"
          y="75"
          textAnchor="middle"
          className="fill-white font-bold text-[32px]"
        >
          {Math.round(currentValue)}
        </text>
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="fill-zinc-400 text-[14px] font-medium"
        >
          {sentiment}
        </text>
      </svg>

      {/* Needle */}
      <motion.div
        className="absolute left-1/2 bottom-[35%] w-1.5 h-[40%] rounded-full origin-bottom"
        style={{
          transformOrigin: 'bottom center',
          background: 'linear-gradient(to bottom, #C99733, #FFD163)',
          boxShadow: '0 0 10px rgba(201,151,51,0.3)'
        }}
        animate={{
          rotate: rotation - 90,
        }}
        transition={{
          type: "spring",
          stiffness: 50,
          damping: 15
        }}
      />
    </div>
  );
} 