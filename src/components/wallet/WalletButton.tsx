'use client'

import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';
import { WalletConnectModal } from './WalletConnectModal';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  className?: string;
}

export const WalletButton = ({ className }: WalletButtonProps) => {
  const { isLoggedIn, address, handleLogout } = useWallet();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleClick = () => {
    if (isLoggedIn) {
      handleLogout();  // Disconnect if logged in
    } else {
      setIsConnectModalOpen(true);  // Open connect modal if not logged in
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "px-6 py-2 rounded-full bg-[#FD8700] hover:bg-[#FD8700]/80 transition-colors text-black font-doggie text-xl font-bold border-2 border-black",
          className
        )}
      >
        {isLoggedIn ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'login'}
      </button>

      <WalletConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
}; 