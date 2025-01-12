'use client'

import { Dialog } from '@headlessui/react';
import { X, Wallet, Smartphone, Globe, ClipboardCopy, ExternalLink } from 'lucide-react';
import { LoginMethodsEnum } from '@multiversx/sdk-dapp/types';
import { ExtensionLoginButton, WalletConnectLoginButton, WebWalletLoginButton } from '@multiversx/sdk-dapp/UI';
import { useWallet } from '@/context/WalletContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { Address } from '@multiversx/sdk-core';
import Image from 'next/image';

const connectionMethods = [
  {
    id: LoginMethodsEnum.extension,
    name: 'DeFi Wallet',
    description: 'Connect using the MultiversX DeFi Wallet browser extension',
    icon: <Wallet className="h-5 w-5" />,
    component: ExtensionLoginButton
  },
  {
    id: LoginMethodsEnum.walletconnect,
    name: 'xPortal App',
    description: 'Scan with your xPortal mobile app to connect',
    icon: <Smartphone className="h-5 w-5" />,
    component: WalletConnectLoginButton
  },
  {
    id: LoginMethodsEnum.wallet,
    name: 'Web Wallet',
    description: 'Connect using the MultiversX Web Wallet',
    icon: <Globe className="h-5 w-5" />,
    component: WebWalletLoginButton
  }
];

const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `erd...${addr.slice(-6)}`;
};

// Add interface for token data
interface TokenBalance {
  identifier: string;
  name: string;
  balance: string;
  decimals: number;
  price: number;
  usdValue: number;
  icon?: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { isLoggedIn, address, handleLogout } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  // Add useEffect to fetch token balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !isLoggedIn) return;
      
      try {
        setIsLoading(true);
        
        // Fetch EGLD balance
        const proxy = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com');
        const account = await proxy.getAccount(new Address(address));
        const egldBalance = account.balance.toString();
        
        // Get EGLD price from API
        const egldPriceResponse = await fetch('https://api.multiversx.com/economics');
        const egldPriceData = await egldPriceResponse.json();
        const egldPrice = egldPriceData.price;
        
        // Format EGLD data
        const egldData = {
          identifier: 'EGLD',
          name: 'MultiversX eGold',
          balance: egldBalance,
          decimals: 18,
          price: egldPrice,
          usdValue: (Number(egldBalance) / Math.pow(10, 18)) * egldPrice,
          icon: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/tokens/EGLD-bd4d79.png'
        };

        // Fetch ESDT tokens
        const response = await fetch(
          `https://devnet-api.multiversx.com/accounts/${address}/tokens?size=100&includeMetaESDT=true`
        );
        const tokensData = await response.json();
        
        // Format tokens data
        const otherTokens = tokensData
          .filter((token: any) => Number(token.balance) > 0) // Filter non-zero balances
          .map((token: any) => ({
            identifier: token.identifier,
            name: token.name || token.identifier,
            balance: token.balance,
            decimals: token.decimals,
            price: token.price,
            usdValue: token.balance ? (Number(token.balance) / Math.pow(10, token.decimals)) * (token.price || 0) : 0,
            icon: token.assets?.svgUrl || token.assets?.pngUrl || `https://raw.githubusercontent.com/multiversx/mx-assets/master/tokens/${token.identifier}.png`
          }))
          .filter((token: TokenBalance) => token.usdValue > 0); // Filter tokens with USD value

        console.log('Tokens loaded:', { egld: egldData, others: otherTokens }); // Debug log

        // Combine EGLD with other tokens and sort by USD value
        const allTokens = [egldData, ...otherTokens]
          .sort((a, b) => b.usdValue - a.usdValue);

        const total = allTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
        
        setTokenBalances(allTokens);
        setTotalValue(total);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && isLoggedIn) {
      fetchBalances();
    }
  }, [address, isLoggedIn, isOpen]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You can add a toast notification here if you want
      // toast.success('Address copied to clipboard');
    }
  };

  const commonButtonProps = {
    callbackRoute: window.location.href,
    nativeAuth: true,
  };

  // Add this inside your existing modal content where isLoggedIn is true
  const renderTokenBalances = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Portfolio Value</h3>
        <div className="text-xl font-bold text-white">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {tokenBalances.map((token) => (
            <div
              key={token.identifier}
              className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/20 
                       transition-all duration-300 flex items-center gap-3"
            >
              {/* Token Icon */}
              <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                <Image
                  src={token.icon || '/placeholder.png'}
                  alt={token.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white truncate">
                    {token.name}
                  </span>
                  <span className="text-white font-mono">
                    ${token.usdValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm text-white/60 truncate">
                    {token.identifier}
                  </span>
                  <span className="text-sm text-white/60 font-mono">
                    {(Number(token.balance) / Math.pow(10, token.decimals)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={isOpen || false}
      onClose={onClose || (() => {})}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-y-0 right-0 flex w-full max-w-sm">
        <Dialog.Panel className="w-full bg-[#0A0A0A] shadow-xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <Dialog.Title className="text-lg font-semibold text-white">
                {isLoggedIn ? 'Wallet Connected' : 'Connect Wallet'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6">
              {isLoggedIn ? (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Connected Address</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={copyAddress}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                          title="Copy Address"
                        >
                          <ClipboardCopy className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                        </button>
                        <a 
                          href={`https://devnet-explorer.multiversx.com/accounts/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-white text-sm">
                        {formatAddress(address || '')}
                      </div>
                      <button 
                        onClick={copyAddress}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors group inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                      >
                        <ClipboardCopy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Add the token balances section */}
                  {renderTokenBalances()}

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-500/10 text-red-500 
                             hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectionMethods.map((method) => {
                    const Component = method.component;
                    return (
                      <motion.div
                        key={method.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <Component
                          {...commonButtonProps}
                          {...(method.id === LoginMethodsEnum.walletconnect && { 
                            isWalletConnectV2: true 
                          })}
                          {...(method.id === LoginMethodsEnum.wallet && {
                            redirectUrl: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '/',
                            shouldRenderDefaultCss: false,
                            callbackRoute: typeof window !== 'undefined' ? window.location.pathname : '/'
                          })}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3
                                   bg-white/5 hover:bg-white/10 text-white rounded-xl
                                   transition-colors duration-200"
                        >
                          <div className="flex items-center gap-2">
                            {method.icon}
                            <span>{method.name}</span>
                          </div>
                        </Component>
                        <p className="text-sm text-white/60 px-2">
                          {method.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 