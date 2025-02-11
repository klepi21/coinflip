'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RetroGrid } from '@/components/ui/retro-grid';
import Image from "next/image";
import { useWallet } from '@/context/WalletContext';
import { toast, Toaster } from 'sonner';
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction,
  AddressValue,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import flipcoinAbi from '@/config/flipcoin.abi.json';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const ADMIN_ADDRESSES = [
  'erd12xqam5lxx6xeteaewx25xarqd3ypleetkv35w40nuqchsxqar9zqkslg66',
  'erd19dgrdm4md8yc7lhvrpgwnnpkzfwlglht8xv6c5nv9lvclx9kp62q2fcjzh',
  'erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4'
];
const RARE_IDENTIFIER = 'RARE-99e8b0';

interface FaucetInfo {
  token: string;
  amount: string;
  has_enough_balance: boolean;
  can_claim: boolean;
}

interface NetworkStats {
  roundsPassed: number;
  roundsPerEpoch: number;
}

export default function Faucet() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, address } = useWallet();
  const { network } = useGetNetworkConfig();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  const fetchFaucetInfo = async () => {
    if (!address) return;

    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getFaucetInfo"),
        args: [new AddressValue(new Address(address))]
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getFaucetInfo");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      const info = values[0].valueOf();
      setFaucetInfo({
        token: info.token.toString(),
        amount: info.amount.toString(),
        has_enough_balance: info.has_enough_balance,
        can_claim: info.can_claim
      });
    } catch (error) {
      console.error('Error fetching faucet info:', error);
      toast.error('Failed to fetch faucet information');
    }
  };

  const fetchNetworkStats = async () => {
    try {
      const response = await fetch('https://api.multiversx.com/stats');
      const data = await response.json();
      setNetworkStats({
        roundsPassed: data.roundsPassed,
        roundsPerEpoch: data.roundsPerEpoch
      });
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const calculateCountdown = () => {
    if (!networkStats) return;

    const roundsLeft = networkStats.roundsPerEpoch - networkStats.roundsPassed;
    const secondsLeft = roundsLeft * 6;
    
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    if (address) {
      fetchFaucetInfo();
    }
  }, [address, network.apiAddress]);

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(() => {
      fetchNetworkStats();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (networkStats) {
      calculateCountdown();
      const interval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [networkStats]);

  const handleClaim = async () => {
    if (!isLoggedIn || !faucetInfo) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!faucetInfo.can_claim) {
      toast.error('You cannot claim at this time');
      return;
    }

    try {
      setIsLoading(true);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .claim([])
        .withGasLimit(10000000)
        .withChainID(network.chainId)
        .buildTransaction();

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing claim transaction',
          errorMessage: 'An error occurred during claiming',
          successMessage: 'Successfully claimed tokens!'
        }
      });

      if (sessionId) {
        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshAccount();
        await fetchFaucetInfo();
      }
    } catch (error) {
      console.error('Error claiming:', error);
      toast.error('Failed to claim tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isLoggedIn || !depositAmount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setIsDepositing(true);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const payment = TokenPayment.fungibleFromAmount(
        RARE_IDENTIFIER,
        depositAmount,
        18
      );
      
      const transaction = contract.methods
        .deposit([])
        .withSingleESDTTransfer(payment)
        .withGasLimit(10000000)
        .withChainID(network.chainId)
        .buildTransaction();

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
        await refreshAccount();
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

  return (
    <main className="relative h-screen overflow-hidden bg-black">
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
                    Get 
                      RARE
                    tokens to participate in voting and other activities. You can claim once per epoch.
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
                    disabled={!isLoggedIn || !faucetInfo?.can_claim || isLoading || !faucetInfo?.has_enough_balance}
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-all ${
                      !isLoggedIn || !faucetInfo?.can_claim || isLoading || !faucetInfo?.has_enough_balance
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black hover:opacity-90'
                    }`}
                  >
                    {!isLoggedIn 
                      ? 'Connect Wallet to Claim' 
                      : isLoading 
                        ? 'Processing...' 
                        : !faucetInfo?.has_enough_balance
                          ? 'Insufficient Faucet Balance'
                          : faucetInfo?.can_claim 
                            ? 'Claim Tokens' 
                            : 'Already Claimed'}
                  </button>

                  {/* Note */}
                  <div className="mt-6">
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      This faucet provides 

                        RARE
                      tokens for Vote purposes. You can claim once per epoch.
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
    </main>
  );
} 