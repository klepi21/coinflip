'use client'

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '../wallet/WalletButton';
import { NavBar } from '../ui/tubelight-navbar';
import { Home, Coins, Menu, X, User, Shield } from 'lucide-react';
import { HyperText } from '../ui/hyper-text';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';

export const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isLoggedIn, address } = useWallet();

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Liquid Funds', url: '/liquid-funds', icon: Coins },
    { name: 'Scratch', url: '/scratch', icon: Coins },
    {
      name: 'Supervision',
      url: '/supervision',
      icon: Shield,
      requiresAuth: true
    }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-lg border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center">
            <HyperText
              text="CRYPTOMURMURA2.0"
              className="text-base sm:text-lg font-bold text-white"
              duration={1000}
              animateOnLoad={false}
            />
          </Link>
          
          <div className="hidden md:flex flex-1 justify-center">
            <NavBar 
              items={navItems} 
              className="!static !transform-none !mb-0 !pt-0" 
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <WalletButton />
            {isLoggedIn && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors
                          border border-white/10"
                aria-label="Open Wallet"
              >
                <User className="w-5 h-5 text-white/80" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Profile Sidebar */}
          <WalletModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 border-t border-white/10"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    pathname === item.url
                      ? 'bg-primary text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              <div className="px-4 pt-2">
                <WalletButton className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};