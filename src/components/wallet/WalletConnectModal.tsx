import { Dialog } from '@headlessui/react';
import { Globe, Smartphone, Wallet, X } from 'lucide-react';
import { LoginMethodsEnum } from '@multiversx/sdk-dapp/types';
import { ExtensionLoginButton, WalletConnectLoginButton, WebWalletLoginButton } from '@multiversx/sdk-dapp/UI';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const WalletConnectModal = ({ isOpen, onClose }: WalletConnectModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-white">
              Connect Wallet
            </Dialog.Title>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {connectionMethods.map((method) => {
              const LoginButton = method.component;
              return (
                <LoginButton
                  key={method.id}
                  className="w-full bg-white/5 hover:bg-white/10 text-white 
                           rounded-xl p-4 transition-all duration-300
                           flex items-center gap-4 group"
                  callbackRoute={window.location.pathname}
                >
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
                    {method.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-white/60">{method.description}</div>
                  </div>
                </LoginButton>
              );
            })}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 