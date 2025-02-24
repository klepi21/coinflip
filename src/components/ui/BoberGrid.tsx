'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { toast, Toaster } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useGetSignedTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetSignedTransactions';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { useGetSuccessfulTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetSuccessfulTransactions';
import { useGetFailedTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetFailedTransactions';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwtt3pune4g0ayaykvmg6nvr4ls045lr7gm9s2fj2al';
const GAMES_PER_PAGE = 15;
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';
const BOBER_IDENTIFIER = 'BOBER-9eb764';
const TOM_IDENTIFIER = 'TOM-48414f';
const BATEMAN_IDENTIFIER = 'BATEMAN-f6fd19';
const VILLER_IDENTIFIER = 'VILLER-cab1fb';
const MEX_IDENTIFIER = 'MEX-455c57';
const USDC_IDENTIFIER = 'USDC-c76f1f';
const DNA_IDENTIFIER = 'DNA-b144d1';
const XOXNO_IDENTIFIER = 'XOXNO-c1293a';

// Token configuration
const TOKEN_DECIMALS = 18;

// Add token decimals mapping
const TOKEN_DECIMALS_MAP: Record<string, number> = {
  'EGLD': 18,
  [RARE_IDENTIFIER]: 18,
  [BOD_IDENTIFIER]: 18,
  [BOBER_IDENTIFIER]: 18,
  [TOM_IDENTIFIER]: 18,
  [BATEMAN_IDENTIFIER]: 18,
  [VILLER_IDENTIFIER]: 10,
  [MEX_IDENTIFIER]: 18,
  [USDC_IDENTIFIER]: 6,
  [DNA_IDENTIFIER]: 18,
  [XOXNO_IDENTIFIER]: 18
};

// Token data with images
const TOKEN_IMAGES: Record<string, string> = {
  [RARE_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`,
  [BOD_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BOD_IDENTIFIER}/icon.svg`,
  [BOBER_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BOBER_IDENTIFIER}/icon.svg`,
  [TOM_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${TOM_IDENTIFIER}/icon.svg`,
  [BATEMAN_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BATEMAN_IDENTIFIER}/icon.svg`,
  [VILLER_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${VILLER_IDENTIFIER}/icon.svg`,
  [MEX_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${MEX_IDENTIFIER}/icon.svg`,
  [USDC_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${USDC_IDENTIFIER}/icon.svg`,
  [DNA_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${DNA_IDENTIFIER}/icon.svg`,
  [XOXNO_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${XOXNO_IDENTIFIER}/icon.svg`,
  'EGLD': 'https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png'
};

// Add SIDES constant at the top with other constants
const SIDES = {
  GRM: {
    name: 'GRM',
    image: '/img/grm.png?v=3'
  },
  SASU: {
    name: 'SASU',
    image: '/img/sasu.png?v=3'
  }
};

type TokenFilter = 'all' | 'EGLD' | 'RARE-99e8b0' | 'BOD-204877' | 'BOBER-9eb764' | 'TOM-48414f' | 'BATEMAN-f6fd19' | 'VILLER-cab1fb' | 'MEX-455c57' | 'USDC-c76f1f' | 'DNA-b144d1' | 'XOXNO-c1293a';

const formatTokenAmount = (amount: string, token: string): string => {
  try {
    const BigNumber = require('bignumber.js');
    // Get token-specific decimals or default to 18
    const decimals = TOKEN_DECIMALS_MAP[token] || 18;
    const value = new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
    
    // For EGLD show 2 decimal places, for other tokens show whole number
    return token === 'EGLD' ? value.toFixed(2) : Math.floor(value).toString();
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

type Props = {
  onActiveGamesChange?: (count: number) => void;
};

export default function BoberGrid({ onActiveGamesChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { hasPendingTransactions } = useGetPendingTransactions();
  const { hasSignedTransactions } = useGetSignedTransactions();
  const { hasSuccessfulTransactions } = useGetSuccessfulTransactions();
  const { hasFailedTransactions } = useGetFailedTransactions();

  const { network } = useGetNetworkConfig();
  const { address: connectedAddress } = useGetAccountInfo();
  const { account } = useGetAccountInfo();
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(connectedAddress || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(connectedAddress || '', BOD_IDENTIFIER);
  const { balance: boberBalance, isLoading: isLoadingBober } = useTokenBalance(connectedAddress || '', BOBER_IDENTIFIER);
  const { balance: tomBalance, isLoading: isLoadingTom } = useTokenBalance(connectedAddress || '', TOM_IDENTIFIER);
  const { balance: bateBalance, isLoading: isLoadingBate } = useTokenBalance(connectedAddress || '', BATEMAN_IDENTIFIER);
  const { balance: villerBalance, isLoading: isLoadingViller } = useTokenBalance(connectedAddress || '', VILLER_IDENTIFIER);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleJoinGame = async (gameId: number, amount: string, token: string) => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Convert gameId to hex and pad to ensure even length
      const gameIdHex = gameId.toString(16).padStart(2, '0');
      
      // Create the join transaction
      let joinTransaction;
      if (token === 'EGLD') {
        joinTransaction = {
          value: amount,
          data: `joinGame@${gameIdHex}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000
        };
      } else {
        // Convert amount to hex and ensure even length
        const amountBigInt = BigInt(amount);
        let amountHex = amountBigInt.toString(16);
        // Pad with leading zero if odd length
        if (amountHex.length % 2 !== 0) {
          amountHex = '0' + amountHex;
        }
        
        joinTransaction = {
          value: '0',
          data: `ESDTTransfer@${Buffer.from(token).toString('hex')}@${amountHex}@${Buffer.from('joinGame').toString('hex')}@${gameIdHex}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000
        };
      }

      // Create the fee transaction (0.003 EGLD)
      const feeTransaction = {
        value: '3000000000000000', // 0.003 EGLD in atomic units (18 decimals)
        data: '',
        receiver: 'erd1u9694m42z79ay4pxdf2w8qxgdfk26w9m9jpfwdfeqysw65fv5g9s4djpad',
        gasLimit: 50000
      };

      // Send both transactions in a single batch
      const { sessionId } = await sendTransactions({
        transactions: [feeTransaction, joinTransaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing game transaction',
          errorMessage: 'An error occurred during game transaction',
          successMessage: 'Game transaction successful'
        },
        callbackRoute: window.location.pathname
      });

      if (!sessionId) {
        throw new Error('Failed to get transaction session ID');
      }

      setSessionId(sessionId);

      // Wait for initial blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, account.shard === 1 ? 10000 : 25000));
      await refreshAccount();

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Refresh games
      fetchActiveGames();

    } catch (error) {
      console.error('Join game error:', error);
      toast.error('Failed to join game');
    }
  };

  const canJoinGame = (gameAmount: string, tokenIdentifier: string): boolean => {
    if (!connectedAddress || isLoadingRare || isLoadingBod || isLoadingBate || isLoadingBober || isLoadingTom || isLoadingViller) return false;
    
    try {
      const currentBalance = tokenIdentifier === RARE_IDENTIFIER ? rareBalance :
                            tokenIdentifier === BOD_IDENTIFIER ? bodBalance :
                            tokenIdentifier === BATEMAN_IDENTIFIER ? bateBalance :
                            tokenIdentifier === BOBER_IDENTIFIER ? boberBalance :
                            tokenIdentifier === TOM_IDENTIFIER ? tomBalance :
                            tokenIdentifier === VILLER_IDENTIFIER ? villerBalance :
                            Number(account.balance) / Math.pow(10, 18);
      
      // Get token-specific decimals
      const decimals = TOKEN_DECIMALS_MAP[tokenIdentifier] || 18;
      // Convert amounts to numbers for comparison using correct decimals
      const requiredAmount = Number(gameAmount) / (10 ** decimals);
      
      return currentBalance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  };

  const decodeGameData = (data: string[]): any[] => {
    const games: any[] = [];
    
    // Process pairs of data (id and game data)
    for (let i = 0; i < data.length; i += 2) {
      try {
        // Get the hex string of the game data
        const gameDataHex = Buffer.from(data[i + 1], 'base64').toString('hex');
        
        // Extract ID from the first 16 chars of game data
        const idHex = gameDataHex.substring(0, 16);
        const id = parseInt(idHex.replace(/^0+/, ''), 16); // Remove leading zeros before parsing

        // Extract choice (2 chars after id)
        const choiceHex = gameDataHex.substring(16, 18);
        const side = parseInt(choiceHex, 16);

        // Extract token length (8 chars)
        const tokenLengthHex = gameDataHex.substring(18, 26);
        const tokenLength = parseInt(tokenLengthHex, 16) * 2; // multiply by 2 because each byte is 2 hex chars

        // Extract token (tokenLength chars)
        const tokenHex = gameDataHex.substring(26, 26 + tokenLength);
        const token = Buffer.from(tokenHex, 'hex').toString('utf8');

        // Extract amount length (8 chars after token)
        const amountLengthHex = gameDataHex.substring(26 + tokenLength, 26 + tokenLength + 8);
        const amountLength = parseInt(amountLengthHex, 16) * 2;

        // Extract amount
        const amountHex = gameDataHex.substring(26 + tokenLength + 8, 26 + tokenLength + 8 + amountLength);
        const amount = BigInt('0x' + amountHex).toString();

        // Extract creator address (last 64 chars)
        const creatorHex = gameDataHex.substring(gameDataHex.length - 64);
        const creator = `erd1${creatorHex}`;

        // Convert value to token units
        const decimals = TOKEN_DECIMALS_MAP[token] || 18;
        const valueShort = Number(BigInt(amount)) / Math.pow(10, decimals);

        games.push({
          id,
          side,
          token,
          amount,
          valueShort,
          creator
        });
      } catch (error) {
        console.error('Error decoding game data:', error);
      }
    }

    return games;
  };

  const fetchActiveGames = async () => {
    try {
      setIsLoading(true);
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
      });

      const query = contract.createQuery({
        func: "activeGames",
      });

      const queryResponse = await provider.queryContract(query);
      
      if (queryResponse?.returnData) {
        const decodedGames = decodeGameData(queryResponse.returnData);
        setActiveGames(decodedGames);
        if (onActiveGamesChange) {
          onActiveGamesChange(decodedGames.length);
        }
      }
    } catch (error) {
      console.error('Error fetching active games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGames();
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveGames, 10000);
    return () => clearInterval(interval);
  }, [network.apiAddress]);

  // Filter games based on token selection
  const filteredGames = tokenFilter === 'all' 
    ? activeGames 
    : activeGames.filter(game => game.token === tokenFilter);

  // Pagination
  const gamesPerPage = isMobile ? 6 : GAMES_PER_PAGE;
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  const currentGames = filteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
            color: 'white',
            zIndex: 200,
          },
          className: 'my-toast-class',
        }}
        richColors
      />
      
      {/* Transaction Notification */}
      {(hasPendingTransactions || hasSignedTransactions || hasSuccessfulTransactions || hasFailedTransactions) && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1A1A1A] rounded-lg p-4 border border-[#C99733] text-white shadow-lg">
          {hasPendingTransactions && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C99733] border-t-transparent"></div>
              <span>Processing transaction...</span>
            </div>
          )}
          {hasSignedTransactions && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#C99733]" />
              <span>Transaction signed</span>
            </div>
          )}
          {hasSuccessfulTransactions && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Transaction successful!</span>
            </div>
          )}
          {hasFailedTransactions && (
            <div className="flex items-center gap-2">
              <span className="text-red-500">×</span>
              <span>Transaction failed</span>
            </div>
          )}
        </div>
      )}
      
      {/* Stats and Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex gap-2 lg:gap-4 text-sm lg:text-base">
          <div className="bg-[#1A1A1A] rounded-full px-3 lg:px-6 py-1.5 lg:py-2 text-white">
            <span className="font-bold">{activeGames.length}</span> ACTIVE
          </div>
        </div>
        
        {/* Token Filter */}
        <div className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-2">
          <button
            onClick={() => setTokenFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tokenFilter === 'all' 
                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' 
                : 'text-white hover:text-[#C99733]'
            }`}
          >
            All
          </button>
          {Object.entries(TOKEN_IMAGES)
            .map(([token, image]) => ({
              token,
              image,
              count: activeGames.filter(game => game.token === token).length
            }))
            .sort((a, b) => b.count - a.count)
            .map(({ token, image, count }) => (
              <button
                key={token}
                onClick={() => setTokenFilter(token as TokenFilter)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all relative ${
                  tokenFilter === token 
                    ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] p-1' 
                    : count > 0 
                      ? 'hover:bg-zinc-800' 
                      : 'opacity-40 hover:opacity-60'
                }`}
                title={`${token === 'EGLD' ? 'EGLD' : token.split('-')[0]} (${count} active)`}
              >
                <div className={`w-6 h-6 rounded-full overflow-hidden ${count === 0 ? 'grayscale' : ''}`}>
                  <Image
                    src={image}
                    alt={token}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                </div>
                {count > 0 && (
                  <div className="absolute -top-2 -right-2 bg-[#C99733] text-black text-[10px] px-1.5 rounded-full min-w-[18px] text-center">
                    {count}
                  </div>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && activeGames.length === 0 ? (
          // Loading placeholders
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`placeholder-${index}`} className="relative pb-8">
              <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="flex relative min-h-[160px] sm:min-h-[200px] bg-[#007E76]">
                  {/* Left Player Placeholder */}
                  <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 mb-2"></div>
                    <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                    <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                  </div>

                  {/* Right Player Placeholder */}
                  <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 mb-2"></div>
                    <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                    <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : currentGames.length > 0 ? (
          currentGames.map((game) => (
            <div key={game.id} className="relative pb-8">
              <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg">
                <div className="flex relative min-h-[160px] sm:min-h-[200px] bg-[#007E76]">
                  {/* Left Player (Creator) */}
                  <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 sm:w-24 sm:h-24">
                      <Image
                        src={game.side === 0 
                          ? 'https://boberbattle.com/flip-icon-heads-light.webp'
                          : 'https://boberbattle.com/flip-icon-tails-light.webp'
                        }
                        alt={game.side === 0 ? "HEADS" : "TAILS"}
                        width={128}
                        height={128}
                        className="w-full h-full object-contain filter opacity-50"
                      />
                    </div>
                    <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                      {`${game.creator.slice(0, 6)}...${game.creator.slice(-4)}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={TOKEN_IMAGES[game.token]}
                          alt={game.token.split('-')[0]}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatTokenAmount(game.amount, game.token)}
                      </span>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <span className="text-white text-xs font-medium">VS</span>
                    </div>
                  </div>

                  {/* Right Player (Opponent) */}
                  <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 sm:w-24 sm:h-24">
                      <Image
                        src={game.side === 0 
                          ? 'https://boberbattle.com/flip-icon-tails-light.webp'
                          : 'https://boberbattle.com/flip-icon-heads-light.webp'
                        }
                        alt={game.side === 0 ? "TAILS" : "HEADS"}
                        width={128}
                        height={128}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                      Play to win
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={TOKEN_IMAGES[game.token]}
                          alt={game.token.split('-')[0]}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatTokenAmount(game.amount, game.token)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {/* Removed copy button */}
                </div>
              </div>

              {/* Join Button */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-fit border-[#1A1A1A]">
                <button 
                  onClick={() => handleJoinGame(game.id, game.amount, game.token)}
                  disabled={!canJoinGame(game.amount, game.token)}
                  className={`w-full font-semibold py-2 px-8 whitespace-nowrap rounded-full text-sm transition-colors shadow-lg border-8 border-black ${
                    canJoinGame(game.amount, game.token)
                      ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black'
                      : 'bg-zinc-600 cursor-not-allowed text-zinc-400'
                  }`}
                  title={!canJoinGame(game.amount, game.token) ? `Insufficient balance (${formatTokenAmount(game.amount, game.token)})` : ''}
                >
                  {canJoinGame(game.amount, game.token) ? 'Join Battle' : 'Insufficient balance'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4">
            <h3 className="text-2xl font-bold text-white mb-3">No Active Games Found</h3>
            <p className="text-zinc-400 text-lg mb-6">Be the first to create an exciting match and start the action!</p>
            <div className="inline-block bg-gradient-to-r from-[#C99733] to-[#FFD163] rounded-full p-[2px]">
              <div className="bg-black rounded-full px-6 py-2">
                <span className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-transparent bg-clip-text font-semibold">
                  ← Create a New Battle
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {currentGames.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isLoading}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-xl hover:bg-black/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-zinc-400">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-xl hover:bg-black/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
} 