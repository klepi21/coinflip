'use client'

import { Dialog } from '@headlessui/react';
import { X, Wallet, Smartphone, Globe } from 'lucide-react';
import { LoginMethodsEnum } from '@multiversx/sdk-dapp/types';
import { ExtensionLoginButton, WalletConnectLoginButton, WebWalletLoginButton } from '@multiversx/sdk-dapp/UI';
import { useWallet } from '@/context/WalletContext';
import { motion } from 'framer-motion';

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

export const WalletModal = () => {
  const { isModalOpen, closeModal, isLoggedIn, address, handleLogout } = useWallet();

  const commonButtonProps = {
    callbackRoute: window.location.href,
    nativeAuth: true,
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={closeModal}
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
                onClick={closeModal}
                className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6">
              {isLoggedIn ? (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-white/60 mb-1">Connected Address</div>
                    <div className="font-mono text-white">{address}</div>
                  </div>
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