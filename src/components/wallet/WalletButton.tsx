'use client'

import { useWallet } from '@/context/WalletContext';
import { useState, useRef, useEffect } from 'react';
import { WalletConnectModal } from './WalletConnectModal';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface WalletButtonProps {
  className?: string;
}

export const WalletButton = ({ className }: WalletButtonProps) => {
  const { isLoggedIn, address, handleLogout } = useWallet();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!isLoggedIn) {
      setIsConnectModalOpen(true);
    } else {
      // Only toggle dropdown on desktop
      if (window.innerWidth >= 768) {
        setIsDropdownOpen(!isDropdownOpen);
      }
    }
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    handleLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={cn(
          "px-4 py-2 rounded-xl text-white text-sm font-medium border border-zinc-800 bg-[#1A1A1A] hover:border-[#C99733] transition-colors flex items-center gap-2",
          isDropdownOpen && "border-[#C99733]",
          className
        )}
      >
        {isLoggedIn ? (
          <>
            <span>{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
            {/* Only show chevron on desktop */}
            <ChevronDown className={`w-4 h-4 transition-transform hidden md:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {/* Desktop Dropdown - Only show on desktop */}
      {isDropdownOpen && (
        <div className="absolute hidden md:block top-full right-0 mt-2 w-48 bg-[#1A1A1A] border border-zinc-800 rounded-xl overflow-hidden shadow-xl z-50">
          <button 
            onClick={handleLogoutClick}
            className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:text-black transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Mobile Menu Button - This will be styled in the parent mobile menu */}
      {isLoggedIn && (
        <div className="md:hidden">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">Disconnect Wallet</span>
          </button>
        </div>
      )}

      <WalletConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}; 