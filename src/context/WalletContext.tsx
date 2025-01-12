'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useGetLoginInfo, useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { logout } from '@multiversx/sdk-dapp/utils';

interface WalletContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleLogout: () => void;
  isLoggedIn: boolean;
  address: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoggedIn } = useGetLoginInfo();
  const { address } = useGetAccountInfo();

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleLogout = useCallback(() => {
    logout();
    closeModal();
  }, [closeModal]);

  return (
    <WalletContext.Provider 
      value={{ 
        isModalOpen, 
        openModal, 
        closeModal, 
        handleLogout,
        isLoggedIn,
        address
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}; 