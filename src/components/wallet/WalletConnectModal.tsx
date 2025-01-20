'use client'

import { Dialog } from '@headlessui/react';
import { LuArrowUpRight, LuChevronRight, LuWallet, LuX } from 'react-icons/lu';
import { MdLaptop } from 'react-icons/md';
import { BiLogoGoogle } from 'react-icons/bi';
import { GiFox } from 'react-icons/gi';
import { BsUsbDrive } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import { 
  ExtensionLoginButton, 
  WebWalletLoginButton,
  LedgerLoginButton,
  WalletConnectLoginContainer,
  XaliasLoginButton,
  MetamaskLoginButton,
} from '@multiversx/sdk-dapp/UI';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal = ({ isOpen, onClose }: WalletModalProps) => {
  const router = useRouter();
  const callbackUrl = '/';
  
  const commonProps = {
    callbackRoute: callbackUrl,
    onClose: onClose,
    onLoginRedirect: () => {
      router.push(callbackUrl);
      onClose();
    }
  };

  const buttons = [
    {
      name: 'DeFi Extension',
      component: ExtensionLoginButton,
      icon: <LuWallet className='icon-lg' />
    },
    {
      name: 'Web Wallet',
      component: WebWalletLoginButton,
      icon: <MdLaptop className='icon-lg' />
    },
    {
      name: 'Ledger',
      component: LedgerLoginButton,
      icon: <BsUsbDrive className='icon-lg' />
    }
  ];

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-end p-4">
        <Dialog.Panel className="relative h-full w-full md:w-[400px] bg-[#69B7C7] 
          rounded-2xl overflow-auto border-2 border-black">
          <div className="flex flex-col px-5 py-3 max-md:px-4 max-md:py-2 gap-0 rounded-xl w-full h-full">
            <div className="flex flex-row justify-between items-center gap-2">
              <h2 className="flex justify-center items-center text-xl md:text-2xl font-medium text-black font-doggie">
                Connect your wallet
              </h2>
              <button onClick={onClose} className="rounded-full h-full w-fit py-1">
                <LuX className="icon-lg text-black" />
              </button>
            </div>

            <div className="flex flex-col w-full gap-2 justify-between md:justify-evenly h-full font-medium">
              {/* xPortal QR Section */}
              <div className="flex flex-col justify-between gap-0 w-full rounded-2xl bg-black/10 py-2 mt-3 border-2 border-black">
                <p className="flex font-medium items-center px-3 gap-1 text-black">
                  Scan the QR code with
                  <span className="text-black font-bold">xPortal app</span>
                </p>

                <WalletConnectLoginContainer 
                  loginButtonText="xPortal App"
                  title=""
                  lead=""
                  legacyMessage=""
                  innerWalletConnectComponentsClasses={{
                    containerButtonClassName: 'xportal-login-button',
                    containerTitleClassName: 'hidden',
                    containerSubtitleClassName: 'hidden',
                    containerLegacyClassName: 'hidden',
                    containerQrCodeClassName: 'xportal-qr-code',
                    containerLoaderClassName: 'xportal-loader',
                    containerContentClassName: 'xportal-content',
                    containerErrorClassName: 'xportal-error-message',
                    containerScamPhishingAlertClassName: 'hidden',
                    walletConnectPairingListClassNames: {
                      leadClassName: 'xportal-pairing-list-lead',
                      wrapperClassName: 'xportal-pairing-list-wrapper',
                      buttonClassName: 'xportal-pairing-list-button',
                      detailsClassName: 'xportal-pairing-list-details',
                      removeClassName: 'xportal-pairing-list-remove',
                      iconClassName: 'xportal-pairing-list-icon',
                    }
                  }}
                  {...commonProps}
                  showScamPhishingAlert={false}
                  wrapContentInsideModal={false}
                />

                <div className="flex flex-row gap-1 justify-between items-center px-4 text-sm font-normal mt-3 md:mt-5">
                  <p className="flex items-center justify-center">Don't have xPortal?</p>
                  <a
                    target="_blank"
                    className="flex items-center justify-center hover:underline text-xportalteal w-fit"
                    href="https://xportal.com/app"
                  >
                    Get it now
                    <LuArrowUpRight className="icon" />
                  </a>
                </div>
              </div>

              {/* xAlias Login */}
              <XaliasLoginButton
                buttonClassName="xalias-login-button"
                {...commonProps}
              >
                <div className="flex flex-row gap-5 items-center text-black">
                  <BiLogoGoogle size={24} />
                  <p>Google</p>
                  <p className="text-xs -ml-3">(xAlias)</p>
                  <LuChevronRight className="icon-lg ml-auto"/>
                </div>
              </XaliasLoginButton>

              {/* MetaMask Login */}
              <MetamaskLoginButton
                buttonClassName="metamask-login-button"
                {...commonProps}
              >
                <div className="flex flex-row gap-5 items-center text-black">
                  <GiFox size={24} />
                  MetaMask
                  <LuChevronRight className="icon-lg ml-auto"/>
                </div>
              </MetamaskLoginButton>

              {/* Other Wallet Buttons */}
              <div className="flex flex-col w-full gap-2 justify-between">
                {buttons.map((button) => {
                  const ButtonComponent = button.component;
                  return (
                    <ButtonComponent
                      key={button.name}
                      {...commonProps}
                      buttonClassName="login-button"
                      wrapContentInsideModal={true}
                      showScamPhishingAlert={false}
                      hideButtonWhenModalOpens={false}
                      showProgressBar={false}
                      modalClassName="ledger-login-modal"
                      innerLedgerComponentsClasses={{
                        ledgerConnectClassNames: {
                          ledgerModalTitleClassName: 'ledger-modal-title',
                          ledgerModalSubtitleClassName: 'ledger-modal-subtitle',
                          ledgerModalErrorClassName: 'ledger-modal-error',
                          ledgerModalIconClassName: 'ledger-modal-icon',
                          ledgerModalButtonClassName: 'ledger-modal-button',
                          ledgerModalFooterLinkClassName: 'ledger-modal-footer-link',
                          ledgerModalFooterClassName: 'ledger-modal-footer',
                          ledgerModalContentClassName: 'ledger-modal-content',
                        },
                        addressTableClassNames: {
                          ledgerModalTableItemClassName: 'addresses-ledger-modal-table-item',
                          ledgerModalButtonClassName: 'addresses-ledger-modal-button',
                        },
                      }}
                    >
                      <div className="flex flex-row gap-5 items-center text-black">
                        {button.icon}
                        {button.name}
                        <LuChevronRight className="icon-lg ml-auto"/>
                      </div>
                    </ButtonComponent>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 