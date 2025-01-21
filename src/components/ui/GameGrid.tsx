'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser, 
  ContractFunction,
  BooleanValue,
  U64Value,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { formatAmount } from "@multiversx/sdk-dapp/utils";
import { ApiNetworkProvider } from "@multiversx/sdk-network-providers/out";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { useGames, Game } from '@/hooks/useGames';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const GAMES_PER_PAGE = 9;

// Token configuration
const TOKEN_DECIMALS = 18;

const formatTokenAmount = (amount: string): string => {
  try {
    // Convert scientific notation to a regular string
    const rawAmount = amount.includes('e') 
      ? amount.replace(/e\+?/, 'e')  // normalize scientific notation
      : amount;
    
    // Parse the amount as a regular number first
    const num = parseFloat(rawAmount);
    
    // Convert to regular decimal number
    const decimalAmount = num / Math.pow(10, TOKEN_DECIMALS);
    
    // Format with commas and 2 decimal places
    return decimalAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.00';
  }
};

type GameResult = 'win' | 'lose' | null;

type PopupState = {
  isOpen: boolean;
  message: string;
  isLoading: boolean;
  gameResult: GameResult;
};

type Props = {
  onActiveGamesChange?: (count: number) => void;
};

export default function GameGrid({ onActiveGamesChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'yours'>('all');
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: '',
    isLoading: false,
    gameResult: null
  });
  
  const { games, isInitialLoading, isRefreshing, refetchGames } = useGames();
  const { network } = useGetNetworkConfig();
  const { address: connectedAddress } = useGetAccountInfo();

  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [disappearingGames, setDisappearingGames] = useState<Game[]>([]);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0);

  // Track disappearing games with full game data
  useEffect(() => {
    if (!games || games.length === 0) return;

    // Find games that were in previous state but not in current games
    const currentGameIds = new Set(games.map(g => g.id));
    const disappeared = previousGames.filter(pg => !currentGameIds.has(pg.id));

    if (disappeared.length > 0) {
      setDisappearingGames(prev => [...prev, ...disappeared]);
      
      // Remove from disappearing after animation
      setTimeout(() => {
        setDisappearingGames(prev => prev.filter(g => !disappeared.map(d => d.id).includes(g.id)));
      }, 3000);
    }

    setPreviousGames(games);
  }, [games]);

  // Update active games count whenever games change
  useEffect(() => {
    if (onActiveGamesChange) {
      onActiveGamesChange(games.length);
    }
  }, [games, onActiveGamesChange]);

  // Add function to fetch total games
  const fetchTotalGames = async () => {
    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction('getId'),
      });

      const queryResponse = await provider.queryContract(query);
      
      if (queryResponse?.returnData?.[0]) {
        const endpointDefinition = contract.getEndpoint('getId');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        const totalGames = Number(results.values[0].valueOf().toString());
        setTotalGamesPlayed(totalGames);
      }
    } catch (error) {
      console.error('Error fetching total games:', error);
    }
  };

  // Fetch total games on mount and every minute
  useEffect(() => {
    fetchTotalGames();
    const interval = setInterval(fetchTotalGames, 60000);
    return () => clearInterval(interval);
  }, [network.apiAddress]);

  const fetchHerotag = async (address: string): Promise<string | undefined> => {
    try {
      const apiNetworkProvider = new ApiNetworkProvider(network.apiAddress);
      const accountInfo = await apiNetworkProvider.getAccount(new Address(address));
      return accountInfo.userName || undefined;
    } catch (error) {
      console.error('Error fetching herotag:', error);
      return undefined;
    }
  };

  const checkGameWinner = async (gameId: number): Promise<string> => {
    const provider = new ProxyNetworkProvider(network.apiAddress);
    const contract = new SmartContract({
      address: new Address(SC_ADDRESS),
      abi: AbiRegistry.create(flipcoinAbi)
    });

    const query = contract.createQuery({
      func: new ContractFunction('getWinner'),
      args: [new U64Value(gameId)]
    });
    const queryResponse = await provider.queryContract(query);
    
    const endpointDefinition = contract.getEndpoint('getWinner');
    const resultParser = new ResultsParser();
    const { values } = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
    
    // Convert the Address value to string properly
    const winnerAddress = values[0].valueOf().toString();
    return winnerAddress;
  };

  const handleJoinGame = async (gameId: number, amount: string, token: string) => {
    try {
      setPopup({
        isOpen: true,
        message: 'Preparing transaction...',
        isLoading: true,
        gameResult: null
      });

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .join([new U64Value(gameId)])
        .withGasLimit(60000000)
        .withChainID(network.chainId);

      if (token === 'EGLD') {
        transaction.withValue(amount);
      } else {
        const payment = TokenPayment.fungibleFromAmount(token, amount, 0);
        transaction.withSingleESDTTransfer(payment);
      }

      const tx = transaction.buildTransaction();
      
      setPopup(prev => ({ ...prev, message: 'Confirming transaction...' }));
      
      const { sessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing join game transaction',
          errorMessage: 'An error occurred during join game',
          successMessage: 'Join game transaction successful'
        }
      });

      if (!sessionId) {
        throw new Error('Failed to get transaction session ID');
      }

      setPopup(prev => ({ ...prev, message: 'Waiting for transaction to complete...' }));

      // Wait for initial blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 8000));
      await refreshAccount();

      setPopup(prev => ({ ...prev, message: 'Checking game result...' }));

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      let retries = 3;
      let winner = null;

      while (retries > 0 && !winner) {
        try {
          winner = await checkGameWinner(gameId);
          if (winner) break;
        } catch (error) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!winner) {
        throw new Error('Could not determine game result');
      }

      const isWinner = winner.toLowerCase() === connectedAddress?.toLowerCase();
      
      setPopup({
        isOpen: true,
        message: isWinner ? 'Congratulations! You won the game!' : 'Better luck next time!',
        isLoading: false,
        gameResult: isWinner ? 'win' : 'lose'
      });

      // Refresh games in the background
      refetchGames();

    } catch (error) {
      console.error('Join game error:', error);
      setPopup({
        isOpen: true,
        message: 'Something went wrong. Please check your transaction in Explorer.',
        isLoading: false,
        gameResult: null
      });
    }
  };

  const handleCancelGame = async (gameId: number) => {
    try {
      setPopup({
        isOpen: true,
        message: 'Preparing to cancel game...',
        isLoading: true,
        gameResult: null
      });

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .cancel([new U64Value(gameId)])
        .withGasLimit(60000000)
        .withChainID(network.chainId);

      const tx = transaction.buildTransaction();
      
      setPopup(prev => ({ ...prev, message: 'Confirming cancellation...' }));
      
      const { sessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing game cancellation',
          errorMessage: 'An error occurred during cancellation',
          successMessage: 'Game cancelled successfully'
        }
      });

      if (!sessionId) {
        throw new Error('Failed to get transaction session ID');
      }

      setPopup(prev => ({ ...prev, message: 'Waiting for cancellation to complete...' }));

      // Wait for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 8000));
      await refreshAccount();

      setPopup({
        isOpen: true,
        message: 'Game cancelled successfully!',
        isLoading: false,
        gameResult: null
      });

      // Close popup after 3 seconds
      setTimeout(() => {
        setPopup(prev => ({ ...prev, isOpen: false }));
      }, 3000);

      // Refresh games in the background
      refetchGames();

    } catch (error) {
      console.error('Cancel game error:', error);
      setPopup({
        isOpen: true,
        message: 'Something went wrong. Please check your transaction in Explorer.',
        isLoading: false,
        gameResult: null
      });
    }
  };

  // Filter games based on selection and sort by newest first
  const filteredGames = (filter === 'all' 
    ? games 
    : games.filter(game => game.creator.toLowerCase() === connectedAddress?.toLowerCase()))
    .sort((a, b) => b.id - a.id); // Sort by ID in descending order

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
  const endIndex = startIndex + GAMES_PER_PAGE;
  const currentGames = filteredGames.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      {/* Stats and Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 sm:gap-4 text-sm sm:text-base">
          <div className="bg-[#1A1A1A] rounded-full px-3 sm:px-6 py-1.5 sm:py-2 text-white">
            <span className="font-bold">{games.length}</span> ACTIVE
          </div>
          <div className="bg-[#1A1A1A] rounded-full px-3 sm:px-6 py-1.5 sm:py-2 text-white">
            <span className="font-bold">{totalGamesPlayed}</span> PLAYED
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('yours')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition-colors ${
              filter === 'yours'
                ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Your Games
          </button>
        </div>
      </div>

      {/* Games Grid with Fixed Height Container */}
      <div className="min-h-[600px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isInitialLoading ? (
            // Show placeholder cards during initial load
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`placeholder-${index}`} className="relative pb-6">
                <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="flex relative min-h-[140px]">
                    {/* Left Player Placeholder */}
                    <div className="flex-1 p-4 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2"></div>
                      <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </div>

                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800">
                        <span className="text-zinc-500 text-xs">VS</span>
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 transform -translate-x-1/2"></div>

                    {/* Right Player Placeholder */}
                    <div className="flex-1 p-4 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2"></div>
                      <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Disappearing Games with Animation */}
              {disappearingGames.map((game) => (
                <div key={`disappearing-${game.id}`} className="relative pb-6">
                  <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg min-h-[140px] animate-fadeOut">
                    {/* Keep the original game card content for smooth transition */}
                    <div className="flex relative min-h-[140px] opacity-30">
                      {/* Left Player (Creator) */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src="https://i.ibb.co/zFg3c9G/Screenshot-2025-01-21-at-1-17-39-AM.png"
                            alt="Creator"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                          {game.creatorHerotag || `${game.creator.slice(0, 5)}...${game.creator.slice(-4)}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm font-medium">
                            {formatTokenAmount(game.amount)}
                          </span>
                        </div>
                      </div>

                      {/* VS Badge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800">
                          <span className="text-zinc-500 text-xs">VS</span>
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 transform -translate-x-1/2"></div>

                      {/* Right Player (Rival) */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src="https://i.ibb.co/zFg3c9G/Screenshot-2025-01-21-at-1-17-39-AM.png"
                            alt="Rival"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                          {game.rival 
                            ? (game.rivalHerotag || `${game.rival.slice(0, 5)}...${game.rival.slice(-4)}`)
                            : 'Waiting...'}
                        </span>
                        {game.rival && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-sm font-medium">
                              {formatTokenAmount(game.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coin Flip Animation Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="animate-coinFlip">
                        <div className="w-32 h-32 relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C99733] to-[#FFD163] backface-hidden flex items-center justify-center shadow-lg border-4 border-black">
                            <Image
                              src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg"
                              alt="MINCU"
                              width={64}
                              height={64}
                              className="w-16 h-16"
                            />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C99733] to-[#FFD163] backface-hidden rotate-y-180 flex items-center justify-center shadow-lg border-4 border-black">
                            <Image
                              src="https://i.ibb.co/yqzHwmn/Screenshot-2025-01-21-at-1-49-31-AM.png"
                              alt="Lower Expectations"
                              width={64}
                              height={64}
                              className="w-16 h-16"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Games */}
              {currentGames.map((game) => (
                <div 
                  key={game.id} 
                  className={`relative pb-6 transition-opacity duration-300 ${
                    isRefreshing ? 'opacity-80' : 'opacity-100'
                  }`}
                >
                  {/* Main box with players */}
                  <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg">
                    <div className="flex relative min-h-[140px]">
                      {/* Left Player (Creator) */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src="https://i.ibb.co/zFg3c9G/Screenshot-2025-01-21-at-1-17-39-AM.png"
                            alt="Creator"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                          {game.creatorHerotag || `${game.creator.slice(0, 5)}...${game.creator.slice(-4)}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm font-medium">
                            {formatTokenAmount(game.amount)}
                          </span>
                        </div>
                      </div>

                      {/* VS Badge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800">
                          <span className="text-zinc-500 text-xs">VS</span>
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 transform -translate-x-1/2"></div>

                      {/* Right Player (Rival) */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src="https://i.ibb.co/zFg3c9G/Screenshot-2025-01-21-at-1-17-39-AM.png"
                            alt="Rival"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                          {game.rival 
                            ? (game.rivalHerotag || `${game.rival.slice(0, 5)}...${game.rival.slice(-4)}`)
                            : 'Waiting...'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm font-medium">
                            {formatTokenAmount(game.amount)}
                          </span>
                        </div>
                        {game.rival && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-sm font-medium">
                              {formatTokenAmount(game.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Join/Cancel Button - Only show if no rival */}
                  {!game.rival && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[calc(50%)] border-[#1A1A1A]">
                      {!connectedAddress ? (
                        <button 
                          disabled
                          className="w-full bg-zinc-600 cursor-not-allowed text-black font-semibold py-2 px-4 rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                        >
                          Connect Wallet
                        </button>
                      ) : game.creator.toLowerCase() === connectedAddress?.toLowerCase() ? (
                        <button 
                          onClick={() => handleCancelGame(game.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinGame(game.id, game.amount, game.token)}
                          className="w-full bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black font-semibold py-2 px-4 rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                        >
                          Join game
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Fixed Position Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4 sticky bottom-6">
          <div className="bg-[#1A1A1A] rounded-full px-6 py-2 flex items-center gap-4 border border-zinc-800">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 1 ? 'text-zinc-600' : 'text-white hover:bg-zinc-800'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full transition-colors ${
                currentPage === totalPages ? 'text-zinc-600' : 'text-white hover:bg-zinc-800'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Result Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] rounded-3xl p-8 max-w-md w-full mx-4 relative border border-zinc-800 shadow-[0_0_50px_-12px] shadow-[#C99733]/20">
            {popup.isLoading ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-zinc-800"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#C99733] border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold text-white">{popup.message}</h3>
                  <p className="text-zinc-400 text-sm">Please wait while we process your transaction</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                {popup.gameResult && (
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      popup.gameResult === 'win' ? 'bg-[#C99733]/10' : 'bg-zinc-800/50'
                    }`}>
                      <span className="text-5xl animate-bounce">
                        {popup.gameResult === 'win' ? '🎉' : '🎲'}
                      </span>
                    </div>
                    {popup.gameResult === 'win' && (
                      <div className="absolute -inset-2 rounded-full border-2 border-[#C99733]/30 animate-pulse"></div>
                    )}
                  </div>
                )}
                <div className="space-y-2 text-center">
                  <h3 className={`text-2xl font-bold ${
                    popup.gameResult === 'win' ? 'text-[#FFD163]' : 'text-white'
                  }`}>
                    {popup.gameResult === 'win' 
                      ? 'Congratulations! You Won!' 
                      : popup.gameResult === 'lose'
                      ? 'Better Luck Next Time!'
                      : 'Transaction Status'}
                  </h3>
                  <p className="text-zinc-400">{popup.message}</p>
                </div>
                <button
                  onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}
                  className="mt-4 group relative px-8 py-3 bg-[#1A1A1A] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#C99733] to-[#FFD163] transition-all duration-300 ease-out group-hover:w-full"></div>
                  <span className="relative group-hover:text-black">Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes coinFlip {
      0% { transform: rotateY(0) scale(1); }
      50% { transform: rotateY(360deg) scale(1.2); }
      100% { transform: rotateY(720deg) scale(1); }
    }

    @keyframes fadeOut {
      0% { opacity: 1; }
      85% { opacity: 1; }
      100% { opacity: 0; }
    }

    .animate-coinFlip {
      animation: coinFlip 3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .animate-fadeOut {
      animation: fadeOut 3s ease-in-out forwards;
    }

    .backface-hidden {
      backface-visibility: hidden;
    }

    .rotate-y-180 {
      transform: rotateY(180deg);
    }
  `;
  document.head.appendChild(styleSheet);
} 