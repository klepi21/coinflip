import React from 'react';
import { ExtensionLoginButton, WalletConnectLoginButton, WebWalletLoginButton } from '@multiversx/sdk-dapp/UI';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks';
import { mvxConfig } from '../config/config';
import { Wallet2 } from 'lucide-react';

const commonProps = {
  callbackRoute: '/',
  nativeAuth: true
};

export const WalletConnect = () => {
  const { isLoggedIn } = useGetLoginInfo();

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="text-center mb-8">
        <Wallet2 className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
        <p className="text-gray-600 mt-2">Choose your preferred wallet to connect</p>
      </div>
      
      <WalletConnectLoginButton
        {...commonProps}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        loginButtonText="xPortal Mobile App"
      />
      
      <ExtensionLoginButton
        {...commonProps}
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        loginButtonText="DeFi Wallet"
      />
      
      <WebWalletLoginButton
        {...commonProps}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        loginButtonText="Web Wallet"
      />
    </div>
  );
};