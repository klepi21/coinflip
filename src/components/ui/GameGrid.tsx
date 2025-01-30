'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, Grid2X2, Grid3X3 } from "lucide-react";
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
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { GlovesAnimation } from './GlovesAnimation';
import { GameStatusModal } from './GameStatusModal';
import { toast, Toaster } from 'sonner';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const GAMES_PER_PAGE = 9;
const MINCU_IDENTIFIER = 'MINCU-38e93d';
const LUCIAN_IDENTIFIER = 'LUCIAN-e61415';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';

// Token configuration
const TOKEN_DECIMALS = 18;

// Token data with images
const TOKENS = {
  EGLD: {
    id: 'EGLD',
    name: 'EGLD',
    image: `https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png`,
    decimals: 18
  },
  LUCIAN: {
    id: 'LUCIAN',
    name: 'LUCIAN',
    image: 'https://pbs.twimg.com/media/Gh5Ylu9WAAAFfCE?format=jpg&name=large',
    decimals: 18
  },
  RARE: {
    id: 'RARE',
    name: 'RARE',
    image: 'https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg',
    decimals: 18
  },
  BOD: {
    id: 'BOD',
    name: 'BOD',
    image: 'https://tools.multiversx.com/assets-cdn/tokens/BOD-204877/icon.png',
    decimals: 18
  }
};

// Add SIDES constant at the top with other constants
const SIDES = {
  GRM: {
    name: 'GRM',
    image: '/img/grm.png'
  },
  SASU: {
    name: 'SASU',
    image: '/img/sasu.png'
  }
};

const formatTokenAmount = (amount: string): string => {
  try {
    const value = Number(amount) / (10 ** TOKEN_DECIMALS);
    // Use Intl.NumberFormat to format the number without rounding
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(value);
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

type GameResult = 'win' | 'lose' | null;

type PopupState = {
  isOpen: boolean;
  message: string;
  isLoading: boolean;
  gameResult: GameResult;
};

type FilterType = 'all' | 'highest' | 'lowest' | 'yours';

type GridView = '2x2' | '3x3';

type Props = {
  onActiveGamesChange?: (count: number) => void;
};

export default function GameGrid({ onActiveGamesChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [gridView, setGridView] = useState<GridView>('3x3');
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: '',
    isLoading: false,
    gameResult: null
  });
  
  const { games, isInitialLoading, isRefreshing, refetchGames } = useGames();
  const { network } = useGetNetworkConfig();
  const { address: connectedAddress } = useGetAccountInfo();
  const accountInfo = useGetAccountInfo();
  const { balance: mincuBalance, isLoading: isLoadingBalance } = useTokenBalance(connectedAddress || '', MINCU_IDENTIFIER);
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(connectedAddress || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(connectedAddress || '', BOD_IDENTIFIER);

  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [disappearingGames, setDisappearingGames] = useState<Game[]>([]);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [transactionStep, setTransactionStep] = useState<'signing' | 'processing' | 'checking' | 'revealing'>('signing');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
        setTotalGames(totalGames);
      }
    } catch (error) {
      console.error('Error fetching total games:', error);
    }
  };

  // Fetch total games only on mount
  useEffect(() => {
    fetchTotalGames();
  }, []);


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

  // Add type guard for token
  const isValidToken = (token: string): token is keyof typeof TOKENS => {
    return token in TOKENS;
  };

  const handleJoinGame = async (game: Game) => {
    if (!isValidToken(game.token)) {
      toast.error('Invalid token type');
      return;
    }

    try {
      setIsWaitingForTx(true);
      setSelectedGame(game);

      const decimalAmount = TOKENS[game.token].decimals;
      const rawAmount = (BigInt(game.amount) * BigInt(10 ** decimalAmount)).toString(16);

      let transaction;
      if (game.token === 'EGLD') {
        // EGLD transaction
        transaction = {
          value: rawAmount.toString(),
          data: `join@${game.id}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000,
        };
      } else {
        // Token transaction
        const tokenIdentifier = game.token === 'RARE' ? RARE_IDENTIFIER : BOD_IDENTIFIER;
        transaction = {
          value: '0',
          data: `ESDTTransfer@${Buffer.from(tokenIdentifier).toString('hex')}@${rawAmount}@${Buffer.from('join').toString('hex')}@${game.id}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000,
        };
      }

      const { sessionId: newSessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing game join...',
          errorMessage: 'Failed to join game',
          successMessage: 'Successfully joined game!'
        }
      });

      setSessionId(newSessionId);
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
      setIsWaitingForTx(false);
    }
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setGameResult(null);
  };

  const handleCancelGame = async (gameId: number) => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading(
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-white">Cancelling game...</p>
          <p className="text-sm text-zinc-400">Please wait while we process your request</p>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          }
        }
      );

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .cancel([new U64Value(gameId)])
        .withSender(new Address(connectedAddress))
        .withGasLimit(10000000)
        .withChainID(network.chainId);
        
      const tx = transaction.buildTransaction();
      
      const { sessionId, error } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing game cancellation',
          errorMessage: 'An error occurred during cancellation',
          successMessage: 'Game cancelled successfully'
        }
      });

      if (error) {
        toast.dismiss(loadingToastId);
        throw new Error(error);
      }

      // Wait for initial blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, accountInfo.shard === 1 ? 10000 : 25000));
      await refreshAccount();

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToastId);
      toast.success(
        <div className="flex flex-col space-y-2">
          <div className="p-4">
            <p className="text-sm font-medium text-white">Game Cancelled!</p>
            <p className="mt-1 text-sm text-zinc-400">Your game has been cancelled successfully.</p>
          </div>
          <div className="border-t border-zinc-800 p-2">
            <button
              onClick={() => refetchGames()}
              className="w-full p-2 text-sm font-medium text-[#C99733] hover:text-[#FFD163] transition-colors rounded-md hover:bg-zinc-800/50"
            >
              Refresh Games
            </button>
          </div>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          },
          duration: 5000,
        }
      );

      // Refresh games
      await refetchGames();

    } catch (error: any) {
      console.error('Cancel game error:', error);
      // Don't show error toast since the transaction might still be processing
      if (error?.message?.includes('Request error on url')) {
        toast.info(
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-white">Transaction Processing</p>
            <p className="text-sm text-zinc-400">Please wait for network confirmation</p>
          </div>,
          {
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(201, 151, 51, 0.1)',
            }
          }
        );
        // Still refresh games as the transaction might have gone through
        await refetchGames();
      } else {
        toast.error(
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-white">Error</p>
            <p className="text-sm text-zinc-400">Something went wrong. Please try again.</p>
          </div>,
          {
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(201, 151, 51, 0.1)',
            }
          }
        );
      }
    }
  };

  const canJoinGame = (gameAmount: string, tokenIdentifier: string): boolean => {
    if (!connectedAddress || isLoadingBalance) return false;
    
    try {
      const currentBalance = tokenIdentifier === RARE_IDENTIFIER ? rareBalance : bodBalance;
      // Convert amounts to numbers for comparison
      const requiredAmount = Number(gameAmount) / (10 ** TOKEN_DECIMALS);
      
      return currentBalance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  };

  // Adjust games per page based on grid view
  const getGamesPerPage = () => {
    return gridView === '2x2' ? 6 : 9;
  };

  // Filter and sort games based on selection
  const filteredGames = (() => {
    let filtered = games;
    
    // First apply owner filter
    if (filter === 'yours') {
      filtered = filtered.filter(game => game.creator.toLowerCase() === connectedAddress?.toLowerCase());
    }
    
    // Then apply sorting
    switch (filter) {
      case 'highest':
        return filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      case 'lowest':
        return filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      default:
        return filtered.sort((a, b) => b.id - a.id); // Default sort by newest
    }
  })();

  // Pagination
  const gamesPerPage = getGamesPerPage();
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  const currentGames = filteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  );

  // Reset to first page when changing grid view
  useEffect(() => {
    setCurrentPage(1);
  }, [gridView]);

  // Get display text for current filter
  const getFilterDisplayText = (filterType: FilterType) => {
    switch (filterType) {
      case 'all': return 'All Games';
      case 'highest': return 'Highest Value';
      case 'lowest': return 'Lowest Value';
      case 'yours': return 'Your Games';
    }
  };

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
      {/* Stats and Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex gap-2 lg:gap-4 text-sm lg:text-base">
          <div className="bg-[#1A1A1A] rounded-full px-3 lg:px-6 py-1.5 lg:py-2 text-white">
            <span className="font-bold">{games.length}</span> ACTIVE
          </div>
          <div className="bg-[#1A1A1A] rounded-full px-3 lg:px-6 py-1.5 lg:py-2 text-white">
            <span className="font-bold">{totalGames - games.length}</span> PLAYED
          </div>
        </div>
        
        {/* Filter and View Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Grid View Toggle */}
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl p-1">
            <button
              onClick={() => setGridView('2x2')}
              className={`p-2 rounded-lg transition-colors ${
                gridView === '2x2' 
                  ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' 
                  : 'text-white hover:text-[#C99733]'
              }`}
              title="2 Columns (6 games)"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridView('3x3')}
              className={`p-2 rounded-lg transition-colors ${
                gridView === '3x3' 
                  ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' 
                  : 'text-white hover:text-[#C99733]'
              }`}
              title="3 Columns (9 games)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Existing Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full lg:w-48 h-10 px-4 rounded-xl bg-[#1A1A1A] border border-zinc-800 text-white flex items-center justify-between hover:border-[#C99733] transition-colors"
            >
              <span>{getFilterDisplayText(filter)}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)} 
                />
                
                <div className="absolute top-full mt-2 w-full lg:w-48 bg-[#1A1A1A] border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-lg">
                  {(['all', 'highest', 'lowest', 'yours'] as FilterType[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setFilter(option);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:text-black transition-colors ${
                        filter === option 
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' 
                          : 'text-white'
                      }`}
                    >
                      {getFilterDisplayText(option)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedGames.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-white">
                {selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected
              </span>
              <button
                className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Play Selected Games
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Games Grid with Dynamic Layout */}
      <div className="min-h-[200px] flex flex-col">
        <div className={`grid gap-6 grid-rows-2 md:grid-rows-3 ${
          gridView === '2x2' 
            ? 'grid-cols-1 lg:grid-cols-2' 
            : 'grid-cols-1 lg:grid-cols-3'
        }`}>
          {isInitialLoading ? (
            // Show placeholder cards during initial load
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`placeholder-${index}`} className="relative pb-6">
                <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="flex relative min-h-[130px]" style={{
                    backgroundImage: "url('/img/fightback.jpg')",
                    backgroundSize: 'auto',
                    backgroundPosition: 'center'
                  }}>
                    {/* Left Player Placeholder */}
                    <div className="flex-1 p-4 flex flex-col items-center justify-center  bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2"></div>
                      <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </div>

                    {/* Right Player Placeholder */}
                    <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 mb-2"></div>
                      <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
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
                            src="https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg"
                            alt="Creator"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                          {`${game.creator.slice(0, 5)}...${game.creator.slice(-4)}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm font-medium">
                            {formatTokenAmount(game.amount).split('.')[0]}
                          </span>
                          <Image
                            src="https://tools.multiversx.com/assets-cdn/tokens/RARE-99e8b0/icon.svg"
                            alt="MINCU"
                            width={24}
                            height={24}
                            className="w-8 h-8 rounded-full"
                          />
                        </div>
                      </div>

                      {/* VS Badge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800">
                          <span className="text-zinc-500 text-xs">VS</span>
                        </div>
                      </div>

       

                      {/* Right Player (Rival) */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src="https://tools.multiversx.com/assets-cdn/tokens/BOD-204877/icon.png"
                            alt="Rival"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-black text-xs font-medium mb-1 truncate w-full text-center">
                          {game.rival 
                            ? (`${game.rival.slice(0, 5)}...${game.rival.slice(-4)}`)
                            : 'Waiting...'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-black text-sm font-medium">
                          {formatTokenAmount(game.amount).split('.')[0]}
                          </span>
                          <Image
                            src="https://tools.multiversx.com/assets-cdn/tokens/BOD-204877/icon.png"
                            alt="MINCU"
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gloves Animation Overlay */}
                    <GlovesAnimation />
                  </div>
                </div>
              ))}

              {/* Current Games */}
              {currentGames.map((game) => (
                <div 
                  key={game.id} 
                  className={`relative pb-6 transition-all duration-300 ${
                    isRefreshing ? 'opacity-80' : 'opacity-100'
                  } ${selectedGames.find(g => g.id === game.id) ? 'ring-2 ring-[#C99733] rounded-2xl' : ''}`}
                >
                  {/* Main box with players */}
                  <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg">
                    <div className="flex relative min-h-[180px]" style={{
                      backgroundImage: "url('/img/fightback.jpg')",
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundColor: '#D5D5D5',
                    }}>
                      {/* Left Player (Creator) */}
                      <div className="flex-1 p-1 flex flex-col items-center justify-center">
                        <div className="w-24 h-24">
                          <Image
                            src={game.side === 0 ? '/img/grm.png?v=2' : '/img/sasu.png?v=2'}
                            alt={game.side === 0 ? "GRM" : "SASU"}
                            width={128}
                            height={128}
                            className="w-full h-full object-contain filter opacity-50"
                          />
                        </div>
                        <span className="text-black text-xs font-medium mb-1 truncate w-full text-center">
                          {`${game.creator.slice(0, 3)}...${game.creator.slice(-4)}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-black text-sm font-medium">
                            {formatTokenAmount(game.amount).split('.')[0]}
                          </span>
                          <Image
                            src={game.token === RARE_IDENTIFIER ? TOKENS.RARE.image : TOKENS.BOD.image}
                            alt={game.token === RARE_IDENTIFIER ? "RARE" : "BOD"}
                            width={16}
                            height={16}
                            className="w-6 h-6"
                          />
                        </div>
                      </div>

                      {/* Right Player (Rival) */}
                      <div className="flex-1 p-1 flex flex-col items-center justify-center ml-8  ">
                        <div className="w-24 h-24">
                          <Image
                            src={game.side === 0 ? '/img/sasu.png?v=2' : '/img/grm.png?v=2'}
                            alt={game.side === 0 ? "SASU" : "GRM"}
                            width={128}
                            height={128}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-black text-xs font-medium mb-1 truncate w-full text-center">
                          {game.rival 
                            ? (`${game.rival.slice(0, 5)}...${game.rival.slice(-4)}`)
                            : 'Play to win'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-black text-sm font-medium">
                            {formatTokenAmount(game.amount).split('.')[0]}
                          </span>
                          <Image
                            src={game.token === RARE_IDENTIFIER ? TOKENS.RARE.image : TOKENS.BOD.image}
                            alt={game.token === RARE_IDENTIFIER ? "RARE" : "BOD"}
                            width={16}
                            height={16}
                            className="w-6 h-6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Join/Cancel Button - Only show if no rival */}
                  {!game.rival && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-fit border-[#1A1A1A] mt-8">
                      {!connectedAddress ? (
                        <button 
                          disabled
                          className="w-full bg-zinc-600 cursor-not-allowed text-black font-semibold py-2 px-4 whitespace-nowrap rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                        >
                          Connect Wallet
                        </button>
                      ) : game.creator.toLowerCase() === connectedAddress?.toLowerCase() ? (
                        <button 
                          onClick={() => handleCancelGame(game.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 whitespace-nowrap rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinGame(game)}
                          disabled={!canJoinGame(game.amount, game.token)}
                          className={`w-full font-semibold py-2 px-4 whitespace-nowrap rounded-full text-sm transition-colors shadow-lg border-8 border-black ${
                            canJoinGame(game.amount, game.token)
                              ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black'
                              : 'bg-zinc-600 cursor-not-allowed text-zinc-400'
                          }`}
                          title={!canJoinGame(game.amount, game.token) ? `Insufficient balance (${formatTokenAmount(game.amount)})` : ''}
                        >
                          {canJoinGame(game.amount, game.token) ? 'Join game' : 'Insufficient balance'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Bottom Fixed Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 mb-4 flex justify-center items-center gap-4">
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
      </div>

      <GameStatusModal
        isOpen={showStatusModal}
        onClose={handleCloseStatusModal}
        currentStep={transactionStep}
        gameResult={gameResult}
      />
    </div>
  );
}

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1; }
      85% { opacity: 1; }
      100% { opacity: 0; }
    }

    .animate-fadeOut {
      animation: fadeOut 3s ease-in-out forwards;
    }
  `;
  document.head.appendChild(styleSheet);
} 