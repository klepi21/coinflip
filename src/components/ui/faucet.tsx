'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useWallet } from '@/context/WalletContext';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import { toast } from "sonner";
import { useGetAccountInfo, useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { TokenPayment } from "@multiversx/sdk-core";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Toaster } from "sonner";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser,
  ContractFunction,
  AddressValue
} from "@multiversx/sdk-core";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import flipcoinAbi from '@/config/flipcoin.abi.json';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const ADMIN_ADDRESSES = [
  'erd12xqam5lxx6xeteaewx25xarqd3ypleetkv35w40nuqchsxqar9zqkslg66',
  'erd19dgrdm4md8yc7lhvrpgwnnpkzfwlglht8xv6c5nv9lvclx9kp62q2fcjzh',
  'erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4'
];

export function FaucetComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);
  const [faucetInfo, setFaucetInfo] = useState<any>(null);
  const { isLoggedIn, address } = useWallet();
  const { account } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  const fetchFaucetInfo = async () => {
    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getFaucetInfo"),
        args: [new AddressValue(new Address(address || SC_ADDRESS))]
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getFaucetInfo");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      const info = values[0].valueOf();
      setFaucetInfo({
        token: info.token.toString(),
        amount: info.amount.toString(),
        has_enough_balance: info.has_enough_balance,
        can_claim: info.can_claim,
        faucet_balance: info.faucet_balance?.toString() || '0'
      });
    } catch (error) {
      console.error('Error fetching faucet info:', error);
      toast.error('Failed to fetch faucet information');
    }
  };

  useEffect(() => {
    if (network.apiAddress) {
      fetchFaucetInfo();
      // Refresh every minute
      const interval = setInterval(fetchFaucetInfo, 60000);
      return () => clearInterval(interval);
    }
  }, [network.apiAddress, address]);

  const handleDeposit = async () => {
    if (!isLoggedIn || !depositAmount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setIsDepositing(true);
      
      // Create ESDTTransfer transaction data
      const encodedTokenId = Buffer.from(RARE_IDENTIFIER).toString('hex');
      const rawAmount = (BigInt(depositAmount) * BigInt(10 ** 18)).toString(16).padStart(64, '0');
      const data = `ESDTTransfer@${encodedTokenId}@${rawAmount}@6465706f736974`; // 'deposit' in hex

      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 6000000
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing deposit transaction',
          errorMessage: 'An error occurred during deposit',
          successMessage: 'Successfully deposited tokens!'
        }
      });

      if (sessionId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchFaucetInfo();
        setDepositAmount('');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      toast.error('Failed to deposit tokens');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleClaim = async () => {
    if (!isLoggedIn) return;

    try {
      setIsLoading(true);
      
      const transaction = {
        value: '0',
        data: 'claim',
        receiver: SC_ADDRESS,
        gasLimit: 6000000
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing claim transaction',
          errorMessage: 'An error occurred during claiming',
          successMessage: 'Successfully claimed tokens!'
        }
      });

      if (sessionId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchFaucetInfo();
      }
    } catch (error) {
      console.error('Error claiming:', error);
      toast.error('Failed to claim tokens');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
            color: 'white',
          },
        }}
      />
      <div className="h-full overflow-auto pt-24">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column */}
                <div className="flex flex-col items-center justify-center">
                  {/* Asset */}
                  <div className="w-48 h-48 relative mb-8">
                    <Image
                      src="/img/ufo.png"
                      alt="UFO Token"
                      width={192}
                      height={192}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C99733]/20 to-[#FFD163]/20 rounded-full blur-3xl" />
                  </div>

                  {/* Token Info */}
                  {faucetInfo && (
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                        {Number(faucetInfo.amount) / (10 ** 18)}
                        <span className="flex items-center gap-1">
                          <Image
                            src={`https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`}
                            alt="RARE"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                          {faucetInfo.token.split('-')[0]}
                        </span>
                      </h3>
                      <p className="text-sm text-zinc-400">Available to claim</p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Claim Tokens</h2>
                  <p className="text-zinc-400 mb-8 flex items-center gap-2">
                    Get RARE tokens to participate in voting and other activities. You can claim once per epoch.
                  </p>

                  {/* Status */}
                  <div className="bg-black/30 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-zinc-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        faucetInfo?.can_claim 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {faucetInfo?.can_claim ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Faucet Balance</span>
                      <span className="text-white">
                        {faucetInfo?.has_enough_balance ? 'Available' : 'Insufficient'}
                      </span>
                    </div>
                    {!faucetInfo?.can_claim && countdown && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Next Claim In</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="bg-[#1A1A1A] px-2 py-1 rounded-md border border-zinc-800">
                                <span className="font-mono text-[#C99733]">{countdown.split(':')[0]}</span>
                              </div>
                              <span className="text-zinc-500">h</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="bg-[#1A1A1A] px-2 py-1 rounded-md border border-zinc-800">
                                <span className="font-mono text-[#C99733]">{countdown.split(':')[1]}</span>
                              </div>
                              <span className="text-zinc-500">m</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="bg-[#1A1A1A] px-2 py-1 rounded-md border border-zinc-800">
                                <span className="font-mono text-[#C99733]">{countdown.split(':')[2]}</span>
                              </div>
                              <span className="text-zinc-500">s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Claim Button */}
                  <button
                    onClick={handleClaim}
                    disabled={!isLoggedIn || !faucetInfo?.can_claim || isLoading}
                    className={`w-full h-12 rounded-xl font-medium transition-all ${
                      !isLoggedIn || !faucetInfo?.can_claim || isLoading
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black hover:opacity-90'
                    }`}
                  >
                    {!isLoggedIn 
                      ? 'Connect Wallet to Claim' 
                      : isLoading 
                        ? 'Processing Claim...' 
                        : !faucetInfo?.can_claim
                          ? 'Already Claimed'
                          : 'Claim Tokens'}
                  </button>

                  {/* Note */}
                  <div className="mt-6">
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      This faucet provides RARE tokens for Vote purposes. You can claim once per epoch.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Deposit Section */}
            {isLoggedIn && address && ADMIN_ADDRESSES.includes(address) && (
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  Admin Deposit
                  <span className="flex items-center gap-1">
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`}
                      alt="RARE"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </span>
                </h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount of RARE"
                    className="flex-1 bg-black/30 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount}
                    className={`px-6 rounded-xl font-medium transition-all ${
                      isDepositing || !depositAmount
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black hover:opacity-90'
                    }`}
                  >
                    {isDepositing ? 'Depositing...' : 'Deposit'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 