"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, X, Trophy } from 'lucide-react';
import Image from 'next/image';
import { sha256 } from 'js-sha256';
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useWallet } from '@/context/WalletContext';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  Address, 
  AbiRegistry, 
  SmartContract, 
  ResultsParser, 
  ContractFunction, 
  U64Value,
  BigUIntValue
} from "@multiversx/sdk-core";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import gameAbi from '@/config/game.abi.json';
import Link from 'next/link';
import { getContractForShard } from '@/config/wof-contracts';

// Add font imports
import { Bangers } from 'next/font/google';

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
});

// Add devnet configuration
const DEVNET_CONFIG = {
  apiAddress: 'https://api.multiversx.com',
  chainId: '1',
  shortId: 'mainnet',
  contractAddress: 'erd1qqqqqqqqqqqqqpgqrmqqsq5aa9rnmaecfcepyuy9cdsfzh07fhwsjz80m6'
};

interface WheelMultiplier {
  value: string;
  multiplier: number;
  color: string;
  pattern: string;
}

interface RareOption {
  value: number;
  label: string;
}

const multipliers: WheelMultiplier[] = [
  { value: '20x', multiplier: 20, color: '#C58D2D', pattern: '/img/20x.png' },
  { value: '5x', multiplier: 5, color: '#A96E25', pattern: '/img/5x.png' },
  { value: '3x', multiplier: 3, color: '#885020', pattern: '/img/3x.png' },
  { value: '1x', multiplier: 1, color: '#714222', pattern: '/img/1x.png' },
  { value: '0x', multiplier: 0, color: '#613822', pattern: '/img/0x.png' }
];

const rareOptions: RareOption[] = [
  { value: 0.001, label: '0.001 EGLD' },
  { value: 0.05, label: '0.05 EGLD' },
  { value: 0.1, label: '0.1 EGLD' }
];

const spinningMessages = [
  "Wheel is spinning...",
  "Fortune awaits...",
  "Testing your luck...",
  "The wheel decides...",
  "Moment of truth...",
  "Will fortune favor you?",
  "Destiny spins...",
  "FOMO or FUD?",
  "Your fate is spinning...",
  "Big win incoming?",
];

// Add new loading state messages
const checkingMessages = [
  "Checking blockchain...",
  "Verifying result...",
  "Calculating outcome...",
  "Almost there...",
  "Processing your spin...",
];

const getNetworkProvider = () => {
  return new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
};

export function WheelOfFomo() {
  const { address, isLoggedIn } = useWallet();
  const { network } = useGetNetworkConfig();
  const { account } = useGetAccountInfo();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelMultiplier | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<RareOption>(rareOptions[0]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(spinningMessages[0]);
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [checkingMessage, setCheckingMessage] = useState(checkingMessages[0]);
  const [checkingProgress, setCheckingProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Get the contract address based on user's shard
  const contractAddress = useMemo(() => {
    if (!account?.shard) return getContractForShard(0);
    return getContractForShard(account.shard);
  }, [account?.shard]);

  // Update getContract function to use the shard-based address
  const getContract = useCallback(() => {
    return new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(gameAbi)
    });
  }, [contractAddress]);

  // Add message cycling effect
  useEffect(() => {
    if (!spinning) return;

    const messages = isChecking ? checkingMessages : spinningMessages;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      if (isChecking) {
        setCheckingMessage(messages[currentIndex]);
      } else {
        setCurrentMessage(messages[currentIndex]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [spinning, isChecking]);

  const getAmountWon = async (gameId: number): Promise<string> => {
    let retries = 0;
    const maxRetries = 15;
    const delayMs = 800;

    while (retries < maxRetries) {
      try {
        const provider = new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
        const contract = getContract();

        const query = contract.createQuery({
          func: new ContractFunction("getResult"),
          args: [new U64Value(gameId)]
        });

        const queryResponse = await provider.queryContract(query);

        if (queryResponse?.returnCode === 'ok' && queryResponse?.returnData?.length === 2) {
          const endpointDefinition = contract.getEndpoint('getResult');
          const resultParser = new ResultsParser();
          const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
          
          const isNotScratched = results.values[0].valueOf() as boolean;
          const amountWon = results.values[1].toString();

          // If result is ready (isNotScratched is true and we have an amount), return immediately
          if (isNotScratched && amountWon) {
            return amountWon === '' ? '0' : amountWon;
          }
        }

        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return '0';
  };

  const { transactions } = useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: async (transactionId: string | null) => {
      if (!transactionId) return;
      
      try {
        if (transactions && transactions.length > 0) {
          const tx = transactions[0];
          const provider = getNetworkProvider();
          const txInfo = await provider.getTransaction(tx.hash);
          
          if (txInfo.contractResults) {
            const results = Object.values(txInfo.contractResults);
            
            if (results.length > 0 && results[0].length > 0) {
              const lastResult = results[0][results[0].length - 1];
              
              if (lastResult.data) {
                const parts = lastResult.data.split('@');
                const gameId = parts[parts.length - 1];
                const gameIdDecimal = parseInt(gameId, 16);
                setGameId(gameIdDecimal);

                // Get the result
                const amount = await getAmountWon(gameIdDecimal);
                
                if (amount !== null) {
                  const amountBigInt = BigInt(amount);
                  const betAmount = BigInt(Math.floor(selectedAmount.value * 1e18));
                  const multiplierValue = Number(amountBigInt / betAmount);
                  
                  // Find the corresponding multiplier in our wheel
                  const resultMultiplier = multipliers.find(m => m.multiplier === multiplierValue);
                  if (resultMultiplier) {
                    // Calculate wheel position for this multiplier
                    const sectionAngle = 360 / multipliers.length;
                    const multiplierIndex = multipliers.indexOf(resultMultiplier);
                    const spins = 8; // Reduced spins for quicker final positioning
                    const targetRotation = (spins * 360) + ((multipliers.length - multiplierIndex) * sectionAngle);
                    
                    // Set final rotation and result
                    setRotation(targetRotation);
                    setResult(resultMultiplier);
                    
                    // Stop spinning after animation completes
                    setTimeout(() => {
                      setSpinning(false);
                      setIsChecking(false);
                    }, 3000); // Match the new animation duration
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        setSpinning(false);
        setIsChecking(false);
        setRotation(0);
      }
    },
    onFail: (transactionId: string | null, errorMessage?: string) => {
      setSpinning(false);
      setIsChecking(false);
      setRotation(0);
    }
  });

  // Override network config for devnet
  const customNetworkConfig = {
    ...network,
    apiAddress: DEVNET_CONFIG.apiAddress,
    chainId: DEVNET_CONFIG.chainId,
    shortId: DEVNET_CONFIG.shortId,
  };

  const getCurrentEpoch = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`https://api.multiversx.com/stats?_=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      return data.epoch;
    } catch (error) {
      return 0;
    }
  };

  // Update spinWheel to use the new contract address
  const spinWheel = async () => {
    if (spinning || !isLoggedIn || !address) return;
    
    try {
      const currentEpoch = await getCurrentEpoch();
      
      const provider = new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
      const addressObj = new Address(address);
      const hexAddress = "0x" + addressObj.hex();
      
      const cubedEpoch = Math.pow(currentEpoch, 3);
      const privateString = process.env.NEXT_PUBLIC_PRIVATE_STRING;
      const dataToHash = "." + cubedEpoch + privateString + hexAddress;
      const hashedData = sha256(dataToHash);

      const encodedFunction = 'play';
      const data = `${encodedFunction}@${hashedData}`;
      
      const valueInSmallestUnit = BigInt(Math.floor(selectedAmount.value * 1e18)).toString();
      
      const transaction = {
        value: valueInSmallestUnit,
        data: data,
        receiver: contractAddress,
        gasLimit: 60000000,
        chainID: DEVNET_CONFIG.chainId,
        version: 1
      };

      setSpinning(true);
      setResult(null);
      // Initial spin animation
      setRotation(prev => prev + (360 * 9)); // Reduced initial spins for quicker response

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing spin transaction',
          errorMessage: 'An error occurred during spin',
          successMessage: 'Spin transaction successful'
        },
        redirectAfterSign: false
      });

      if (newSessionId) {
        setSessionId(newSessionId);
        setIsChecking(true);
      }
    } catch (error) {
      setSpinning(false);
      setRotation(0);
    }
  };

  const calculateWinAmount = (amount: number, multiplier: number): string => {
    if (multiplier === 0) return '0';
    // Convert amount to EGLD with 18 decimals and then to BigInt
    const amountInSmallestUnit = BigInt(Math.floor(amount * 1e18));
    const winAmount = amountInSmallestUnit * BigInt(multiplier);
    // Convert back to EGLD format
    return (Number(winAmount) / 1e18).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const getDisplayAmount = (amount: number, multiplier: number): string => {
    if (multiplier === 0) return '0';
    return calculateWinAmount(amount, multiplier) + ' EGLD';
  };

  // Add function to fetch total games
  const fetchTotalGames = async () => {
    try {
      const provider = new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
      const contract = getContract();

      const query = contract.createQuery({
        func: new ContractFunction('getId'),
      });

      const queryResponse = await provider.queryContract(query);
      
      if (queryResponse?.returnData?.[0]) {
        const endpointDefinition = contract.getEndpoint('getId');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        const total = Number(results.values[0].valueOf().toString());
        setTotalGames(total);
      }
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Call fetchTotalGames on component mount and set up interval
  useEffect(() => {
    fetchTotalGames();
    const interval = setInterval(fetchTotalGames, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Log user's shard when component mounts or account changes
  useEffect(() => {
    if (account?.shard !== undefined) {
      // Remove console logs, but keep the effect for future reference
    }
  }, [account?.shard, contractAddress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 md:p-8 pt-48 overflow-x-hidden">
      <div className="w-full max-w-5xl bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl p-4 md:p-8 relative border border-zinc-800 shadow-xl">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Top section - Currency and Mode Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1 w-full">
              <div className="mb-4 md:mb-6">
                <Image
                  src="/img/WheelOfFOMO.png"
                  alt="Wheel of FOMO"
                  width={100}
                  height={33}
                  className="w-100 h-auto"
                  priority
                />
              </div>
              
              {/* Currency Selector */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Token</label>
                <div className="w-full flex items-center justify-between bg-black/30 p-3 rounded-xl text-white border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Image
                      src="https://static.vecteezy.com/system/resources/previews/024/093/136/non_2x/multiversx-egld-glass-crypto-coin-3d-illustration-free-png.png"
                      alt="EGLD"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span>EGLD</span>
                  </div>
                </div>
              </div>

              {/* Winning Odds Table */}
              <div className="bg-black/30 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-zinc-400">Winning Odds</span>
                </div>
                <div className="overflow-hidden">
                  <motion.table 
                    className="w-full border-collapse"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="py-2 px-4 text-left text-sm text-zinc-400">Multiplier</th>
                        <th className="py-2 px-4 text-right text-sm text-zinc-400">Win Potential</th>
                        <th className="py-2 px-4 text-right text-sm text-zinc-400">Odds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { mult: '20x', color: '#FFD700', odds: '0.20%', icon: '🌟', potential: selectedAmount.value * 20 },
                        { mult: '5x', color: '#C0C0C0', odds: '3.00%', icon: '⭐', potential: selectedAmount.value * 5 },
                        { mult: '3x', color: '#CD7F32', odds: '10.00%', icon: '✨', potential: selectedAmount.value * 3 },
                        { mult: 'Money back', color: '#4CAF50', odds: '36.80%', icon: '💫', potential: selectedAmount.value * 1 },
                      ].map((row, index) => (
                        <motion.tr
                          key={row.mult}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" role="img" aria-label="multiplier icon">
                                {row.icon}
                              </span>
                              <motion.span
                                className="font-bold"
                                style={{ color: row.color }}
                                whileHover={{ scale: 1.05 }}
                              >
                                {row.mult}
                              </motion.span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="inline-flex items-center gap-1 justify-end"
                            >
                              <span className="text-[#FFD163]">
                                {row.potential.toFixed(3)}
                              </span>
                              <img
                                src="https://static.vecteezy.com/system/resources/previews/024/093/136/non_2x/multiversx-egld-glass-crypto-coin-3d-illustration-free-png.png"
                                alt="EGLD"
                                className="w-4 h-4"
                              />
                            </motion.div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <motion.div
                              className="inline-block"
                              whileHover={{ scale: 1.05 }}
                            >
                              <span 
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  row.mult === '0x' 
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-[#FFD163]/20 text-[#FFD163]'
                                )}
                              >
                                {row.odds}
                              </span>
                            </motion.div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </motion.table>
                </div>
              </div>

              {/* Total Games Box */}
              <div className="bg-black/30 p-4 rounded-xl border border-zinc-800 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <span className="text-lg">🎡</span> Total Wheel Spins
                  </span>
                  <motion.span 
                    key={totalGames}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl font-bold bg-gradient-to-r from-[#C99733] to-[#FFD163] text-transparent bg-clip-text"
                  >
                    {totalGames?.toLocaleString() || '...'}
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Wheel and Spin Button - Right Column */}
            <div className="space-y-6 order-1 lg:order-2 w-full">
              <div className="relative w-full aspect-square max-w-[300px] md:max-w-[400px] mx-auto">
                <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-[#C99733]">
                  <motion.div
                    className="absolute w-full h-full"
                    animate={{ rotate: rotation }}
                    transition={{ 
                      duration: spinning ? 5 : 3, // Faster initial spin, slower final positioning
                      ease: spinning ? "linear" : [0.2, 0.6, 0.3, 1],
                      type: spinning ? "tween" : "spring",
                      stiffness: spinning ? undefined : 50,
                      damping: spinning ? undefined : 15
                    }}
                    style={{ transformOrigin: "center center" }}
                  >
                    {multipliers.map((multiplier, index) => {
                      const rotation = index * (360 / multipliers.length);
                      const skewAngle = 90 - (360 / multipliers.length);
                      
                      return (
                        <div
                          key={multiplier.value}
                          className="absolute w-1/2 h-1/2 origin-bottom-right"
                          style={{
                            transform: `rotate(${rotation}deg) skew(${skewAngle}deg)`,
                            background: multiplier.color,
                            borderRight: '2px solid rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                              transform: `skew(${-skewAngle}deg) rotate(${-rotation - 60}deg)`,
                              width: '100px',
                              textAlign: 'center',
                            }}
                          >
                            <div className="text-xl md:text-2xl mb-1">
                              <Image
                                src={multiplier.pattern}
                                alt={multiplier.value}
                                width={40}
                                height={40}
                                className="w-10 h-10 md:w-12 md:h-12 mx-auto"
                              />
                            </div>
                            <span className="text-lg md:text-xl font-bold text-white">{multiplier.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Center decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 md:w-16 h-12 md:h-16 rounded-full bg-[#C99733] shadow-lg flex items-center justify-center z-10">
                  <div className="w-9 md:w-12 h-9 md:h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-[#C99733]"></div>
                  </div>
                </div>

                {/* Arrow pointer - Using custom image */}
                <div className="absolute top-[15%] left-0 -translate-x-[calc(100%+2px)] z-20">
                  <Image
                    src="/img/lown.png"
                    alt="Wheel pointer"
                    width={40}
                    height={40}
                    className="w-20 h-20 md:w-22 md:h-22"
                  />
                </div>
              </div>

              {/* Wheel Mode Toggle - Moved here */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Spin amount</label>
                <div className="grid grid-cols-3 gap-2 bg-black/30 p-2 rounded-xl border border-zinc-800">
                  {rareOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedAmount(option)}
                      className={cn(
                        "px-1 md:px-4 py-2 rounded-xl text-white transition-all text-xs md:text-base whitespace-nowrap flex items-center justify-center gap-1",
                        selectedAmount.value === option.value
                          ? "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black"
                          : "hover:bg-zinc-800"
                      )}
                    >
                      {option.value}
                      <Image
                        src="https://static.vecteezy.com/system/resources/previews/024/093/136/non_2x/multiversx-egld-glass-crypto-coin-3d-illustration-free-png.png"
                        alt="EGLD"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={spinWheel}
                disabled={spinning || !isLoggedIn}
                className={cn(
                  "w-full py-3 md:py-4 text-lg md:text-xl font-semibold rounded-xl transition-all relative overflow-hidden",
                  "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:opacity-90"
                )}
              >
                {!isLoggedIn ? (
                  'Connect Wallet to Spin'
                ) : spinning ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🎡</span>
                    <span>{isChecking ? checkingMessage : currentMessage}</span>
                  </div>
                ) : (
                  'Spin Now'
                )}
              </button>
            </div>
          </div>

          {/* Bottom section - PvP Call to Action */}
          <div className="border-t border-[#C99733]/20 pt-4 md:pt-6 w-full">
            <div className="flex flex-col gap-6">
              {/* Title stays centered above */}
              <h3 className="text-xl md:text-2xl font-bold text-white text-center">
                Bored of FOMO?{' '}
                <span className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-transparent bg-clip-text">
                  Try PvP Mode!
                </span>
              </h3>
              
              {/* Video and text in a row */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Video Container - Left side */}
                <div className="relative w-full md:w-1/2 aspect-video rounded-xl overflow-hidden border border-zinc-800">
                  <video
                    src="/img/vsvideo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <Link 
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    >
                      Fight Now
                      <Trophy size={18} />
                    </Link>
                  </div>
                </div>
                
                {/* Text Content - Right side */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <p className="text-zinc-400 text-center md:text-left text-lg">
                    Challenge other players in epic 1v1 battles! 
                    Choose your bet, pick your side, and prove your worth in the arena.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!spinning) {
                setResult(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1A1A] p-8 rounded-xl border border-[#C99733] shadow-xl w-full max-w-sm relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Animated arrow */}
                  <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 mb-2"
                  >
                    <Image
                      src="/img/hypeyarrow.png"
                      alt="Arrow"
                      width={64}
                      height={64}
                      className={`w-full h-full ${result.multiplier === 0 ? 'rotate-180' : ''}`}
                    />
                  </motion.div>

                  {/* Result text with animation */}
                  <motion.h3
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl font-bold mb-2 ${
                      result.multiplier > 0 ? 'text-[#C99733]' : 'text-zinc-500'
                    }`}
                  >
                    {result.value}
                  </motion.h3>

                  {/* Win/Loss message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-zinc-400 mb-4"
                  >
                    {result.multiplier > 1 ? (
                      <>
                        <span className="block text-[#C99733] font-bold mb-1">Congratulations!</span>
                        <span className="block text-white">
                          You won {getDisplayAmount(selectedAmount.value, result.multiplier)}!
                        </span>
                      </>
                    ) : result.multiplier === 1 ? (
                      <>
                        <span className="block text-[#C99733] font-bold mb-1">Money Back!</span>
                        <span className="block text-white">
                          You got your {getDisplayAmount(selectedAmount.value, result.multiplier)} back.
                          <br />
                          <span className="text-zinc-400 text-sm">At least you didn't lose anything!</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block text-zinc-500 font-bold mb-1">Better luck next time!</span>
                        <span className="block text-zinc-400">
                          Don't give up, fortune favors the bold!
                        </span>
                      </>
                    )}
                  </motion.p>

                  {/* Play Again button - Only show when not spinning */}
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setResult(null)}
                    className="px-6 py-2 bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Play Again
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 