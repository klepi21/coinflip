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

// Add devnet configuration
const DEVNET_CONFIG = {
  apiAddress: 'https://devnet-api.multiversx.com',
  chainId: 'D',
  shortId: 'devnet',
  tokenId: 'USDC-350c4e', // Devnet USDC token ID
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
  { value: '100x', multiplier: 100, color: '#BF9129', pattern: '🌟' },
  { value: '10x', multiplier: 10, color: '#D1A23B', pattern: '💫' },
  { value: '5x', multiplier: 5, color: '#E6B84D', pattern: '🚀' },
  { value: '3x', multiplier: 3, color: '#FFD163', pattern: '⭐' },
  { value: '1x', multiplier: 1, color: '#C99733', pattern: '🌠' },
  { value: '0x', multiplier: 0, color: '#4A4A4A', pattern: '☄️' }
];

const rareOptions: RareOption[] = [
  { value: 0.1, label: '0.1 USDC' },
  { value: 0.5, label: '0.5 USDC' },
  { value: 1, label: '1 USDC' }
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
        
        if (!isNotScratched) {
          return amountWon === '' || amountWon === '0' ? '0' : amountWon;
        }
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

                // Start querying for results
                let amount = null;
                for (let i = 0; i < 15; i++) {
                  console.log(`Querying result attempt ${i + 1}/15...`);
                  amount = await getAmountWon(gameIdDecimal);
                  console.log(`Query result for game ${gameIdDecimal}:`, amount);
                  
                  if (amount !== null && amount !== '0') {
                    console.log('Valid amount received:', amount);
                    
                    // Calculate the multiplier based on the amount won
                    const amountBigInt = BigInt(amount);
                    const betAmount = BigInt(Math.floor(selectedAmount.value * 1000000));
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
                    break;
                  }
                  if (i < 14) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
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
      const response = await fetch('https://devnet-api.multiversx.com/stats');
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

      // Create ESDTTransfer transaction data with devnet token ID
      const encodedTokenId = Buffer.from(DEVNET_CONFIG.tokenId).toString('hex');
      const rawAmount = (BigInt(Math.floor(selectedAmount.value * 1000000))).toString(16).padStart(64, '0');
      const encodedFunction = Buffer.from('play').toString('hex');
      const data = `ESDTTransfer@${encodedTokenId}@${rawAmount}@${encodedFunction}@${hashedData}`;
      
      // Prepare transaction with devnet configuration
      const transaction = {
        value: '0',
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
    // Convert amount to USDC with 6 decimals and then to BigInt
    const amountInSmallestUnit = Math.floor(amount * 1000000);
    const winAmount = BigInt(amountInSmallestUnit) * BigInt(multiplier);
    // Convert back to USDC format
    return (Number(winAmount) / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const getDisplayAmount = (amount: number, multiplier: number): string => {
    if (multiplier === 0) return '0';
    return calculateWinAmount(amount, multiplier) + ' USDC';
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
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Wheel of Fomo</h2>
              
              {/* Currency Selector */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Currency</label>
                <div className="w-full flex items-center justify-between bg-black/30 p-3 rounded-xl text-white border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/tokens/USDC-350c4e/icon.svg`}
                      alt="USDC"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span>USDC</span>
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

                {/* Arrow pointer - Adjusted to 11:15 position */}
                <div className="absolute top-[25%] left-0 -translate-x-[calc(100%+2px)] z-20 rotate-[-45deg]">
                  <div className="w-0 h-0 border-l-[12px] md:border-l-[15px] border-r-[12px] md:border-r-[15px] border-t-[20px] md:border-t-[25px] border-l-transparent border-r-transparent border-t-red-600" />
                </div>
              </div>

              {/* Wheel Mode Toggle - Moved here */}
              <div className="space-y-2 w-full">
                <label className="text-sm text-zinc-400">Wheel mode</label>
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
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/tokens/USDC-350c4e/icon.svg`}
                      alt="USDC"
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-white text-xs md:text-sm truncate">
                      {getDisplayAmount(selectedAmount.value, multiplier.multiplier)}
                    </span>
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
              className="bg-[#1A1A1A] p-8 rounded-xl border border-[#C99733] shadow-xl w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-4xl font-bold text-[#C99733] mb-2">
                  {result.value}
                </h3>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 