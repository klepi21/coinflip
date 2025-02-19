"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, X, Trophy } from 'lucide-react';
import Image from 'next/image';
import { sha256 } from 'js-sha256';
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { useWallet } from '@/context/WalletContext';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  Address, 
  AbiRegistry, 
  SmartContract, 
  ResultsParser, 
  ContractFunction, 
  U64Value 
} from "@multiversx/sdk-core";
import { useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks/transactions";
import gameAbi from '@/config/game.abi.json';

// Add font imports
import { Bangers } from 'next/font/google';

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
});

// Add devnet configuration
const DEVNET_CONFIG = {
  apiAddress: 'https://devnet-api.multiversx.com',
  chainId: 'D',
  shortId: 'devnet',
  contractAddress: 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx'
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
  { value: '20x', multiplier: 20, color: '#C58D2D', pattern: '🌟' },
  { value: '5x', multiplier: 5, color: '#A96E25', pattern: '💫' },
  { value: '3x', multiplier: 3, color: '#885020', pattern: '🚀' },
  { value: '1x', multiplier: 1, color: '#714222', pattern: '⭐' },
  { value: '0x', multiplier: 0, color: '#613822', pattern: '☄️' }
];

const rareOptions: RareOption[] = [
  { value: 0.01, label: '0.01 EGLD' },
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

const getContract = (address: string) => {
  return new SmartContract({
    address: new Address(address),
    abi: AbiRegistry.create(gameAbi)
  });
};

const getNetworkProvider = () => {
  return new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
};

const getAmountWon = async (id: number) => {
  let retries = 0;
  const maxRetries = 15;
  const delayMs = 2000; // 2 seconds
  let zeroResultCount = 0; // Counter for consecutive zero results

  while (retries < maxRetries) {
    try {
      const contract = getContract(DEVNET_CONFIG.contractAddress);
      const proxy = getNetworkProvider();

      const query = contract.createQuery({
        func: new ContractFunction('getResult'),
        args: [new U64Value(id)]
      });

      const queryResponse = await proxy.queryContract(query);

      if (queryResponse?.returnCode === 'ok' && queryResponse?.returnData?.length === 2) {
        const endpointDefinition = contract.getEndpoint('getResult');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);

        // First value is boolean (not scratched), second is BigUint (amount won)
        const isNotScratched = results.values[0].valueOf();
        const amountWon = results.values[1].toString();
        
        console.log('Query result:', { isNotScratched, amountWon, zeroResultCount });
        
        // If isNotScratched is true and amount is 0, increment counter
        if (isNotScratched && (amountWon === '' || amountWon === '0')) {
          zeroResultCount++;
          console.log('Zero result count:', zeroResultCount);
          
          // If we've seen this 4 times, return 0 and stop querying
          if (zeroResultCount >= 4) {
            console.log('Received 4 consecutive zero results, confirming loss');
            return '0';
          }
        } else {
          // Reset counter if we get a different result
          zeroResultCount = 0;
        }
        
        // Only return a result when isNotScratched is false (game is over)
        if (!isNotScratched) {
          console.log('Game is over, final result:', amountWon);
          return amountWon === '' || amountWon === '0' ? '0' : amountWon;
        }
        
        console.log('Game still in progress, continuing to poll...');
      }

      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error('Error querying result:', error);
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.log('Max retries reached without getting a final result');
  return '0';
};

export function WheelOfFomo() {
  const { address, isLoggedIn } = useWallet();
  const { network } = useGetNetworkConfig();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelMultiplier | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<RareOption>(rareOptions[0]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(spinningMessages[0]);

  const { transactions } = useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: async (transactionId: string | null) => {
      if (!transactionId) return;
      
      try {
        if (transactions && transactions.length > 0) {
          const tx = transactions[0];
          const provider = getNetworkProvider();
          const txInfo = await provider.getTransaction(tx.hash);
          
          console.log('Full transaction response:', txInfo);
          console.log('Transaction hash:', tx.hash);
          
          if (txInfo.contractResults) {
            console.log('Contract results:', txInfo.contractResults);
            const results = Object.values(txInfo.contractResults);
            console.log('Parsed results:', results);
            
            if (results.length > 0 && results[0].length > 0) {
              // Get the last result which contains the game ID
              const lastResult = results[0][results[0].length - 1];
              console.log('Last result:', lastResult);
              
              if (lastResult.data) {
                const parts = lastResult.data.split('@');
                console.log('Split data parts:', parts);
                // Game ID is the last part
                const gameId = parts[parts.length - 1];
                console.log('Raw game ID (hex):', gameId);
                const gameIdDecimal = parseInt(gameId, 16);
                console.log('Game ID (decimal):', gameIdDecimal);
                setGameId(gameIdDecimal);

                // Get the result
                const amount = await getAmountWon(gameIdDecimal);
                console.log(`Query result for game ${gameIdDecimal}:`, amount);
                
                if (amount !== null) {
                  console.log('Valid amount received:', amount);
                  
                  // Calculate the multiplier based on the amount won
                  const amountBigInt = BigInt(amount);
                  const betAmount = BigInt(Math.floor(selectedAmount.value * 1e18));
                  const multiplierValue = Number(amountBigInt / betAmount);
                  console.log('Calculated multiplier:', multiplierValue);
                  
                  // Find the corresponding multiplier in our wheel
                  const resultMultiplier = multipliers.find(m => m.multiplier === multiplierValue);
                  if (resultMultiplier) {
                    console.log('Found matching wheel multiplier:', resultMultiplier);
                    
                    // Calculate wheel position for this multiplier
                    const sectionAngle = 360 / multipliers.length;
                    const multiplierIndex = multipliers.indexOf(resultMultiplier);
                    const spins = 10; // Number of full spins
                    const targetRotation = (spins * 360) + ((multipliers.length - multiplierIndex) * sectionAngle);
                    
                    console.log('Wheel animation details:', {
                      sectionAngle,
                      multiplierIndex,
                      targetRotation
                    });
                    
                    setRotation(targetRotation);
                    setTimeout(() => {
                      setSpinning(false);
                      setResult(resultMultiplier);
                    }, 20000); // Wait for animation to complete
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing transaction result:', error);
        setSpinning(false);
      }
    },
    onFail: (transactionId: string | null, errorMessage?: string) => {
      console.error('Transaction failed:', errorMessage);
      setSpinning(false);
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
      const response = await fetch(`https://devnet-api.multiversx.com/stats?_=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      return data.epoch;
    } catch (error) {
      console.error('Error fetching epoch:', error);
      return 0;
    }
  };

  const spinWheel = async () => {
    if (spinning || !isLoggedIn || !address) return;
    
    try {
      // Get current epoch
      const currentEpoch = await getCurrentEpoch();
      console.log('Current epoch:', currentEpoch);
      
      // Convert bech32 address to hex using devnet provider
      const provider = new ProxyNetworkProvider(DEVNET_CONFIG.apiAddress);
      const addressObj = new Address(address);
      const hexAddress = "0x" + addressObj.hex();
      
      // Generate hash data with cubed epoch converted to hex
      const cubedEpoch = Math.pow(currentEpoch, 3);
      const dataToHash = "." + cubedEpoch + "poutsa" + hexAddress;
      const hashedData = sha256(dataToHash);

      // Create play transaction data
      const encodedFunction = 'play';
      const data = `${encodedFunction}@${hashedData}`;
      
      // Convert EGLD amount to smallest unit (10^18)
      const valueInSmallestUnit = BigInt(Math.floor(selectedAmount.value * 1e18)).toString();
      
      // Prepare transaction with devnet configuration
      const transaction = {
        value: valueInSmallestUnit,
        data: data,
        receiver: DEVNET_CONFIG.contractAddress,
        gasLimit: 60000000,
        chainID: DEVNET_CONFIG.chainId,
        version: 1
      };

      // Start spinning animation before sending transaction
      setSpinning(true);
      setResult(null);
      setRotation(prev => prev + (360 * 10)); // Start with 10 rotations

      // Send transaction
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
        console.log('Transaction sent with sessionId:', newSessionId);
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error('Error during spin:', error);
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

  useEffect(() => {
    if (spinning) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % spinningMessages.length;
        setCurrentMessage(spinningMessages[messageIndex]);
      }, 3000); // Change message every 3 seconds

      return () => clearInterval(interval);
    }
  }, [spinning]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 md:p-8 pt-48 overflow-x-hidden">
      <div className="w-full max-w-5xl bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl p-4 md:p-8 relative border border-zinc-800 shadow-xl">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Top section - Currency and Mode Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1 w-full">
              <h2 className={`text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 ${bangers.className} tracking-wider`}>
                Wheel of Fomo
              </h2>
              
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

              {/* Odds Table */}
              <div className="bg-black/30 p-4 rounded-xl border border-zinc-800">
                <div className="mb-3">
                  <span className="text-sm text-zinc-400">Winning Odds</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-400 border-b border-zinc-800">
                        <th className="pb-2 text-left font-medium">Multiplier</th>
                        <th className="pb-2 text-right font-medium">Odds</th>
                        <th className="pb-2 text-right font-medium">Return</th>
                        <th className="pb-2 text-right font-medium">1 in...</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">20x</td>
                        <td className="py-2 text-right">0.20%</td>
                        <td className="py-2 text-right">4.00%</td>
                        <td className="py-2 text-right">500</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">5x</td>
                        <td className="py-2 text-right">3.00%</td>
                        <td className="py-2 text-right">15.00%</td>
                        <td className="py-2 text-right">33.33333333</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">3x</td>
                        <td className="py-2 text-right">10.00%</td>
                        <td className="py-2 text-right">30.00%</td>
                        <td className="py-2 text-right">10</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">1x</td>
                        <td className="py-2 text-right">36.80%</td>
                        <td className="py-2 text-right">36.80%</td>
                        <td className="py-2 text-right">2.717391304</td>
                      </tr>
                      <tr>
                        <td className="py-2">0x</td>
                        <td className="py-2 text-right">50.00%</td>
                        <td className="py-2 text-right">0.00%</td>
                        <td className="py-2 text-right">2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {spinning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-4 border-t border-zinc-800"
                  >
                    <motion.p
                      key={currentMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center text-[#C99733] font-medium"
                    >
                      {currentMessage}
                    </motion.p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Wheel and Spin Button - Right Column */}
            <div className="space-y-6 order-1 lg:order-2 w-full">
              <div className="relative w-full aspect-square max-w-[300px] md:max-w-[400px] mx-auto">
                <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-[#C99733]">
                  <motion.div
                    className="absolute w-full h-full"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 20, ease: [0.2, 0.6, 0.3, 1] }}
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
                            <div className="text-xl md:text-2xl mb-1">{multiplier.pattern}</div>
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
                        "px-1 md:px-4 py-2 rounded-xl text-white transition-all text-xs md:text-base whitespace-nowrap",
                        selectedAmount.value === option.value
                          ? "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black"
                          : "hover:bg-zinc-800"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={spinWheel}
                disabled={spinning || !isLoggedIn}
                className={cn(
                  "w-full py-3 md:py-4 text-lg md:text-xl font-semibold rounded-xl transition-all",
                  "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:opacity-90"
                )}
              >
                {!isLoggedIn ? 'Connect Wallet to Spin' : spinning ? 'Spinning...' : 'Spin Now'}
              </button>
            </div>
          </div>

          {/* Bottom section - Tiers */}
          <div className="border-t border-[#C99733]/20 pt-4 md:pt-6 w-full">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Possible Winnings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {multipliers.map((multiplier, index) => (
                <div key={index} className="flex items-center gap-2 bg-black/30 px-2 md:px-4 py-2 rounded-xl border border-zinc-800">
                  <div className="w-4 md:w-6 h-4 md:h-6 rounded-full flex-shrink-0" style={{ background: multiplier.color }} />
                  <div className="flex items-center gap-1">
                    
                    <span className="text-white text-xs md:text-sm truncate">
                      {getDisplayAmount(selectedAmount.value, multiplier.multiplier)}
                    </span>
                    <Image
                      src="https://static.vecteezy.com/system/resources/previews/024/093/136/non_2x/multiversx-egld-glass-crypto-coin-3d-illustration-free-png.png"
                      alt="EGLD"
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1A1A] p-8 rounded-xl border border-[#C99733] shadow-xl w-full max-w-sm relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#C99733]/10 to-[#FFD163]/10 blur-xl" />
              
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

                  {/* Play Again button */}
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