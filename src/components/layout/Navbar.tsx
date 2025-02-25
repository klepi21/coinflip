'use client'

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';
import { HowToPlayModal } from '@/components/ui/how-to-play-modal';
import { cn } from '@/lib/utils';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isWheelHighlighted, setIsWheelHighlighted] = useState(false);
  const { isLoggedIn } = useWallet();

  // Set wheel highlighted if user hasn't visited the Wheel of FOMO page
  useEffect(() => {
    const hasVisitedWof = localStorage.getItem('visited_wof');
    if (!hasVisitedWof && pathname !== '/wof') {
      setIsWheelHighlighted(true);
    } else {
      setIsWheelHighlighted(false);
    }
    
    // If we're on the WOF page, mark it as visited
    if (pathname === '/wof') {
      localStorage.setItem('visited_wof', 'true');
    }
  }, [pathname]);

  // Create a Date object for June 27th, 2024 at 16:00 UTC
  const tokenVotingEndDate = new Date('2024-06-27T16:00:00Z');
  
  // Ensure the date is in the future for testing
  if (tokenVotingEndDate.getTime() <= Date.now()) {
    // If the date has passed, set it to 7 days from now for testing
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(16, 0, 0, 0);
    tokenVotingEndDate.setTime(futureDate.getTime());
  }
  
  // Debug log
  console.log('Token voting end date:', tokenVotingEndDate);
  console.log('Current date:', new Date());
  console.log('Is future date?', tokenVotingEndDate.getTime() > Date.now());
  console.log('Time difference (ms):', tokenVotingEndDate.getTime() - Date.now());

  const navItems = [
    { title: 'Fight', icon: '⚔️', type: undefined, url: '/' },
    { 
      title: 'Wheel of Fomo', 
      icon: '🎡', 
      type: undefined, 
      url: '/wof',
      isHighlighted: isWheelHighlighted
    },
    { 
      title: 'Vote Fighter', 
      icon: '🗳️', 
      type: undefined, 
      url: '/vote',
      disabled: true 
    },
    { 
      title: 'Vote Token', 
      icon: '🎁', 
      type: undefined, 
      url: '/votetoken',
      countdownTo: tokenVotingEndDate
    },
    { title: 'Faucet', icon: '🚰', type: undefined, url: '/faucet' },
    { type: 'separator' as const },
    { title: 'FUDerboard', icon: '📊', type: undefined, url: '/fuderboard' }
  ];

  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      const selectedItem = navItems[index];
      if (selectedItem && 'url' in selectedItem && selectedItem.url) {
        router.push(selectedItem.url);
      }
    }
  };

  // Custom rendering for navbar items to highlight special items
  const renderNavItem = (item: any, isActive: boolean) => {
    if (item.type === 'separator') return null;
    
    // Countdown timer calculation for mobile menu
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    
    useEffect(() => {
      if (!item.countdownTo) return;
      
      const calculateTimeLeft = () => {
        const now = new Date();
        const difference = item.countdownTo.getTime() - now.getTime();
        
        if (difference <= 0) {
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds };
      };
      
      // Initial calculation
      setTimeLeft(calculateTimeLeft());
      
      // Update timer every second
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
      
      return () => clearInterval(timer);
    }, [item.countdownTo]);
    
    return (
      <div key={item.title} className="relative">
        <Link
          href={item.url}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
            isActive
              ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium'
              : 'text-white/80 hover:text-white hover:bg-white/5',
            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/60"
          )}
          onClick={(e) => {
            if (item.disabled) {
              e.preventDefault();
              return;
            }
            setIsMobileMenuOpen(false);
          }}
        >
          <span className={cn(
            "text-xl",
            item.isHighlighted && !isActive && "animate-pulse"
          )}>
            {item.icon}
          </span>
          <span className={cn(
            "font-medium",
            item.isHighlighted && !isActive && "text-[#FFD163]"
          )}>
            {item.title}
          </span>
          
          {/* Special badge for highlighted items */}
          {item.isHighlighted && !isActive && (
            <motion.span 
              className="absolute -top-1 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              HOT
            </motion.span>
          )}
          
          {/* Countdown timer for token voting */}
          {item.countdownTo && (
            <div className="absolute -top-2 -right-2">
              <motion.div 
                className="px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-[#C99733] to-[#FFD163] rounded-full whitespace-nowrap shadow-md"
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {timeLeft.hours.toString().padStart(2, '0')}:
                {timeLeft.minutes.toString().padStart(2, '0')}:
                {timeLeft.seconds.toString().padStart(2, '0')}
              </motion.div>
            </div>
          )}
        </Link>
      </div>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[60px] relative">
          {/* Logo - Left */}
          <div className="absolute left-0">
            <Link href="/" className="flex items-center gap-3 text-white font-bold">
              <img src="/img/fologo.png" alt="Logo" className="h-auto w-32" />
            </Link>
          </div>

          {/* Navigation - Center */}
          <div className="hidden md:flex flex-1 justify-center">
            <ExpandableTabs 
              tabs={navItems}
              className="bg-black/20 border-zinc-800"
              activeColor="text-[#FFD163]"
              activePath={pathname}
              onChange={handleTabChange}
            />
          </div>

         

          {/* Wallet - Right */}
          <div className="absolute right-0">
            <div className="hidden md:block">
              <WalletButton />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/5"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[60px] left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 space-y-4 shadow-xl md:hidden"
        >
          {navItems.filter(item => item.type !== 'separator' && item.title).map((item) => {
            if (!item.title || !item.url) return null;
            const isActive = pathname === item.url;
            
            return renderNavItem(item, isActive);
          })}
          
          <div className="px-4 pt-2">
            <WalletButton className="w-full" />
          </div>
        </motion.div>
      )}

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={isHowToPlayOpen} 
        onClose={() => setIsHowToPlayOpen(false)} 
      />

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={false} 
        onClose={() => {}} 
      />
    </motion.nav>
  );
}