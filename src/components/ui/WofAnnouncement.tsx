'use client'

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from 'react'

// Define wheel multipliers (subset of the actual game for preview)
const previewMultipliers = [
  { value: '20x', color: '#C58D2D' },
  { value: '5x', color: '#A96E25' },
  { value: '3x', color: '#885020' },
  { value: '1x', color: '#714222' },
  { value: '0x', color: '#613822' }
];

export function WofAnnouncement() {
  const [rotation, setRotation] = useState(0);
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [randomWin, setRandomWin] = useState('0.4');
  const [hasVisited, setHasVisited] = useState(true);
  const [showHighlight, setShowHighlight] = useState(false);
  
  // Check if this is first visit
  useEffect(() => {
    const visited = localStorage.getItem('visited_wof_announcement');
    if (!visited) {
      setHasVisited(false);
      setShowHighlight(true);
      localStorage.setItem('visited_wof_announcement', 'true');
      
      // After 2 seconds, show pulsing highlight
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Continuously rotate the wheel
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 60); // Rotate by 60 degrees each time
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Show random win messages
  useEffect(() => {
    const interval = setInterval(() => {
      // Generate a random win amount
      const wins = ['0.2', '0.4', '1.0', '2.5'];
      setRandomWin(wins[Math.floor(Math.random() * wins.length)]);
      setShowWinMessage(true);
      
      // Hide after 3 seconds
      setTimeout(() => {
        setShowWinMessage(false);
      }, 3000);
    }, 6000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mt-12 mb-8 relative z-50">
      {/* Highlight effect for first-time visitors */}
      {showHighlight && (
        <motion.div
          className="absolute -inset-4 bg-gradient-to-r from-[#C99733]/30 to-[#FFD163]/30 rounded-3xl z-0 blur-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: [0, 0.7, 0], 
            scale: [0.9, 1.05, 0.9] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: 3,
            repeatType: "loop" 
          }}
        />
      )}
      

      
      <Link href="/wof">
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-black/70 to-[#151515] rounded-2xl border border-[#C99733] shadow-lg hover:shadow-[#C99733]/20 transition-all duration-300 group"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Background glow elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C99733]/20 to-transparent rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#FFD163]/10 to-transparent rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center p-4 md:p-6">
            {/* Wheel Preview */}
            <div className="flex-shrink-0 w-20 h-20 md:w-28 md:h-28 relative mr-4">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#C99733]">
                <motion.div
                  className="absolute w-full h-full"
                  animate={{ rotate: rotation }}
                  transition={{ 
                    duration: 4,
                    ease: "linear",
                  }}
                  style={{ transformOrigin: "center center" }}
                >
                  {previewMultipliers.map((multiplier, index) => {
                    const rotation = index * (360 / previewMultipliers.length);
                    const skewAngle = 90 - (360 / previewMultipliers.length);
                    
                    return (
                      <div
                        key={multiplier.value}
                        className="absolute w-1/2 h-1/2 origin-bottom-right"
                        style={{
                          transform: `rotate(${rotation}deg) skew(${skewAngle}deg)`,
                          background: multiplier.color,
                          borderRight: '1px solid rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            transform: `skew(${-skewAngle}deg) rotate(${-rotation - 60}deg)`,
                            width: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <span className="text-[8px] md:text-xs font-bold text-white">{multiplier.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
              
              {/* Center decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#C99733] shadow-lg flex items-center justify-center z-10">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#1A1A1A]"></div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row items-center md:items-start">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mt-3 mb-1 md:mt-0 text-center md:text-left">
                    <span className="text-[#FFD163]">Wheel of FOMO</span> - Win up to <span className="text-[#FFD163]">20x</span> Your Bet!
                  </h3>
                  <p className="text-zinc-400 text-sm mb-2 text-center md:text-left">Spin the wheel and multiply your EGLD! Will fortune favor you today?</p>
                  
                  <div className="flex items-center justify-center md:justify-start mt-2">
                    {/* Animated button */}
                    <motion.div
                      className="px-4 py-2 bg-gradient-to-r from-[#C99733] to-[#FFD163] rounded-lg text-black font-bold shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: ['0 0 0 0 rgba(201, 151, 51, 0)', '0 0 20px 5px rgba(201, 151, 51, 0.5)', '0 0 0 0 rgba(201, 151, 51, 0)']
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      Play Now & Win Big!
                    </motion.div>
                  </div>
                </div>
                
                {/* Recent Winners Indicator */}
                <motion.div 
                  className="ml-0 md:ml-4 mt-3 md:mt-0 bg-black/40 px-3 py-2 rounded-lg border border-[#C99733]/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: showWinMessage ? 1 : 0.7,
                    scale: showWinMessage ? 1 : 0.9,
                    y: showWinMessage ? 0 : 5
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-xs text-zinc-400">Recent Winner:</div>
                  <div className="text-sm font-bold text-[#FFD163]">
                    Someone just won {randomWin} EGLD! 🎉
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Arrow indicator */}
            <motion.div
              className="ml-2 text-[#FFD163]"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 4.5L21 12L13.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
          
          {/* "Hot" badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform rotate-6">
            🔥 HOT
          </div>
        </motion.div>
      </Link>
    </div>
  )
} 