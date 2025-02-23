'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, Grid2X2, Grid3X3, Twitter, Copy, Check, Vote } from "lucide-react";
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
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const GAMES_PER_PAGE = 9;
const MINCU_IDENTIFIER = 'MINCU-38e93d';
const LUCIAN_IDENTIFIER = 'LUCIAN-e61415';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';
const BOBER_IDENTIFIER = 'BOBER-9eb764';
const TOM_IDENTIFIER = 'TOM-48414f';
const BATEMAN_IDENTIFIER = 'BATEMAN-f6fd19';
const VILLER_IDENTIFIER = 'VILLER-cab1fb';

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
};

// Token data with images
const TOKEN_IMAGES: Record<string, string> = {
  [RARE_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`,
  [BOD_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BOD_IDENTIFIER}/icon.svg`,
  [BOBER_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BOBER_IDENTIFIER}/icon.svg`,
  [TOM_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${TOM_IDENTIFIER}/icon.svg`,
  [BATEMAN_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BATEMAN_IDENTIFIER}/icon.svg`,
  [VILLER_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${VILLER_IDENTIFIER}/icon.svg`,
  'EGLD': 'https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png'
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

type GameResult = 'win' | 'lose' | null;

type PopupState = {
  isOpen: boolean;
  message: string;
  isLoading: boolean;
  gameResult: GameResult;
};

type FilterType = 'all' | 'highest' | 'lowest' | 'yours';
type TokenFilter = 'all' | 'EGLD' | 'RARE-99e8b0' | 'BOD-204877' | 'BOBER-9eb764' | 'TOM-48414f' | 'BATEMAN-f6fd19' | 'VILLER-cab1fb';

type GridView = '2x2' | '3x3';

type Props = {
  onActiveGamesChange?: (count: number) => void;
};

export default function GameGrid({ onActiveGamesChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('all');
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
  const { account } = useGetAccountInfo();
  const { balance: mincuBalance, isLoading: isLoadingBalance } = useTokenBalance(connectedAddress || '', MINCU_IDENTIFIER);
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(connectedAddress || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(connectedAddress || '', BOD_IDENTIFIER);
  const { balance: boberBalance, isLoading: isLoadingBober } = useTokenBalance(connectedAddress || '', BOBER_IDENTIFIER);
  const { balance: tomBalance, isLoading: isLoadingTom } = useTokenBalance(connectedAddress || '', TOM_IDENTIFIER);
  const { balance: bateBalance, isLoading: isLoadingBate } = useTokenBalance(connectedAddress || '', BATEMAN_IDENTIFIER);
  const { balance: villerBalance, isLoading: isLoadingViller } = useTokenBalance(connectedAddress || '', VILLER_IDENTIFIER);

  const [previousGames, setPreviousGames] = useState<Game[]>([]);
  const [disappearingGames, setDisappearingGames] = useState<Game[]>([]);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [transactionStep, setTransactionStep] = useState<'signing' | 'processing' | 'checking' | 'revealing'>('signing');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const [copiedGameId, setCopiedGameId] = useState<number | null>(null);

  const handleCopyLink = (gameId: number) => {
    const url = `${window.location.origin}/game?id=${gameId}`;
    navigator.clipboard.writeText(url);
    setCopiedGameId(gameId);
    setTimeout(() => setCopiedGameId(null), 2000);
  };

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

  const handleJoinGame = async (gameId: number, amount: string, token: string) => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setShowStatusModal(true);
      setTransactionStep('signing');
      setGameResult(null);

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .join([new U64Value(gameId)])
        .withSender(new Address(connectedAddress))
        .withGasLimit(10000000)
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
          processingMessage: 'Processing game transaction',
          errorMessage: 'An error occurred during game transaction',
          successMessage: 'Transaction successful'
        }
      });

      if (!sessionId) {
        throw new Error('Failed to get transaction session ID');
      }
      console.log('Account info:', account.shard);

      // Wait for initial blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, account.shard === 1 ? 10000 : 25000));
      await refreshAccount();

      setTransactionStep('checking');

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      let retries = 3;
      let winner = null;

      setTransactionStep('revealing');

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
      setGameResult(isWinner ? 'win' : 'lose');

      // Refresh all necessary states
      await Promise.all([
        refreshAccount(),
        refetchGames()
      ]);

    } catch (error) {
      console.error('Join game error:', error);
      setShowStatusModal(false);
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
      await new Promise(resolve => setTimeout(resolve, account.shard === 1 ? 10000 : 25000));
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

  // Adjust games per page based on grid view
  const getGamesPerPage = () => {
    if (gridView === '3x3') {
      return isMobile ? 6 : 15; // 2x3 on mobile, 3x5 on desktop
    }
    return isMobile ? 4 : 12; // 2x2 on mobile, 3x4 on desktop
  };

  // Filter and sort games based on selection
  const filteredGames = (() => {
    let filtered = games;
    
    // First apply token filter
    if (tokenFilter !== 'all') {
      filtered = filtered.filter(game => game.token === tokenFilter);
    }
    
    // Then apply owner filter
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
            // Sort tokens by number of active games (descending)
            .map(([token, image]) => ({
              token,
              image,
              count: games.filter(game => game.token === token).length
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
        <div className={`grid gap-4 md:gap-6 ${
          gridView === '2x2' 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
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
                    <div className="flex relative min-h-[140px] sm:min-h-[180px] opacity-30">
                      {/* Left Player (Creator) */}
                      <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src={TOKEN_IMAGES[game.token] || TOKEN_IMAGES[BOD_IDENTIFIER]}
                            alt={game.token.split('-')[0]}
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
                            {formatTokenAmount(game.amount, game.token)}
                          </span>
                          <Image
                            src={game.token === 'EGLD' 
                              ? TOKEN_IMAGES['EGLD'] 
                              : game.token === RARE_IDENTIFIER 
                                ? TOKEN_IMAGES[RARE_IDENTIFIER] 
                                : TOKEN_IMAGES[BOD_IDENTIFIER]}
                            alt={game.token}
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
                      <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2 bg-zinc-800">
                          <Image
                            src={game.token === 'EGLD' 
                              ? TOKEN_IMAGES['EGLD'] 
                              : game.token === RARE_IDENTIFIER 
                                ? TOKEN_IMAGES[RARE_IDENTIFIER] 
                                : TOKEN_IMAGES[BOD_IDENTIFIER]}
                            alt={game.token}
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
                            {formatTokenAmount(game.amount, game.token)}
                          </span>
                          <Image
                            src={game.token === 'EGLD' 
                              ? TOKEN_IMAGES['EGLD'] 
                              : game.token === RARE_IDENTIFIER 
                                ? TOKEN_IMAGES[RARE_IDENTIFIER] 
                                : TOKEN_IMAGES[BOD_IDENTIFIER]}
                            alt={game.token}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
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
                    {/* Share Buttons */}
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const gameUrl = `${window.location.protocol}//${window.location.host}/game?id=${game.id}`;
                          const shareText = `Join me in this epic battle on F.0! 🎮\nPrize pool: ${formatTokenAmount(game.amount, game.token)} ${game.token.split('-')[0]}\n\n@SuperRare_Bears #MultiversX $EGLD #P2E #Gaming`;
                          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
                          window.open(shareUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="p-1.5 bg-black/50 hover:bg-[#C99733] rounded-full transition-colors backdrop-blur-sm group"
                        title="Share on X (Twitter)"
                      >
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(game.id);
                        }}
                        className="p-1.5 bg-black/50 hover:bg-[#C99733] rounded-full transition-colors backdrop-blur-sm group"
                        title="Copy game link"
                      >
                        {copiedGameId === game.id ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Copy className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="flex relative min-h-[140px] sm:min-h-[180px]" style={{
                      backgroundImage: "url('/img/fightback.jpg')",
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundColor: '#D5D5D5',
                    }}>
                      {/* Left Player (Creator) */}
                      <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24">
                          <Image
                            src={game.side === 0 ? '/img/grm.png?v=3' : '/img/sasu.png?v=3'}
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
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <Image
                              src={TOKEN_IMAGES[game.token] || TOKEN_IMAGES[BOD_IDENTIFIER]}
                              alt={game.token.split('-')[0]}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-black">
                            {formatTokenAmount(game.amount, game.token)} {/*{game.token.split('-')[0]} */}
                          </span>
                        </div>
                      </div>

                      {/* Right Player (Rival) */}
                      <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center ml-8  ">
                        <div className="w-16 h-16 sm:w-24 sm:h-24">
                          <Image
                            src={game.side === 0 ? '/img/sasu.png?v=3' : '/img/grm.png?v=3'}
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
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <Image
                              src={TOKEN_IMAGES[game.token] || TOKEN_IMAGES[BOD_IDENTIFIER]}
                              alt={game.token.split('-')[0]}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-black">
                            {formatTokenAmount(game.amount, game.token)}  {/*{game.token.split('-')[0]} */}
                          </span>
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
                          onClick={() => handleJoinGame(game.id, game.amount, game.token)}
                          disabled={!canJoinGame(game.amount, game.token)}
                          className={`w-full font-semibold py-2 px-4 whitespace-nowrap rounded-full text-sm transition-colors shadow-lg border-8 border-black ${
                            canJoinGame(game.amount, game.token)
                              ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black'
                              : 'bg-zinc-600 cursor-not-allowed text-zinc-400'
                          }`}
                          title={!canJoinGame(game.amount, game.token) ? `Insufficient balance (${formatTokenAmount(game.amount, game.token)})` : ''}
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