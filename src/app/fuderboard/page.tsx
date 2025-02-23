'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction,
  BytesValue
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { Trophy, Crown, Medal, Sprout, Flame, Ghost, Skull } from 'lucide-react';
import { RetroGrid } from '@/components/ui/retro-grid';
import { useWallet } from '@/context/WalletContext';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const ITEMS_PER_PAGE = 5;

interface PlayerScore {
  address: string;
  wins: number;
  losses: number;
}

interface FUDLevel {
  name: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
}

const FUD_LEVELS: FUDLevel[] = [
  {
    name: 'FUD Sprout',
    title: 'FUD Novice',
    description: 'Just dipping their toes into the chaos, this uncertain seedling is taking their first steps into the world of FUD.',
    icon: Sprout,
    color: 'from-emerald-400 to-emerald-600',
    bgGradient: 'from-emerald-500/10 to-transparent'
  },
  {
    name: 'FUD Mixer',
    title: 'FUD Stirrer',
    description: 'Actively stirring the pot, confidently meddling and starting to enjoy the mess.',
    icon: Flame,
    color: 'from-purple-400 to-purple-600',
    bgGradient: 'from-purple-500/10 to-transparent'
  },
  {
    name: 'FUD Phantom',
    title: 'FUD Veteran',
    description: 'A seasoned and sneaky operator, spreading uncertainty like a pro from the shadows.',
    icon: Ghost,
    color: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-500/10 to-transparent'
  },
  {
    name: 'FUD Overlord',
    title: 'FUD Master',
    description: 'The supreme commander of misinformation mayhem, ruling the domain of doubt.',
    icon: Skull,
    color: 'from-red-400 to-red-600',
    bgGradient: 'from-red-500/10 to-transparent'
  }
];

const getFUDLevel = (totalGames: number): FUDLevel => {
  if (totalGames >= 501) return FUD_LEVELS[3];
  if (totalGames >= 51) return FUD_LEVELS[2];
  if (totalGames >= 6) return FUD_LEVELS[1];
  return FUD_LEVELS[0];
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 1:
      return <Crown className="w-5 h-5 text-gray-400" />;
    case 2:
      return <Crown className="w-5 h-5 text-amber-800" />;
    default:
      return <Trophy className="w-4 h-4 text-zinc-600" />;
  }
};

// Player Status Component
function PlayerStatus({ scores, address }: { scores: PlayerScore[], address: string }) {
  const playerScore = scores.find(score => 
    score.address.toLowerCase() === address.toLowerCase()
  );
  
  if (!playerScore) return null;
  
  const totalGames = playerScore.wins + playerScore.losses;
  const winRate = totalGames > 0 
    ? (playerScore.wins / totalGames) * 100 
    : 0;
  
  const level = getFUDLevel(totalGames);
  const Icon = level.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto mb-6"
    >
      <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r ${level.bgGradient}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br opacity-20 rounded-full blur-3xl -z-10" />
        
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Level Icon */}
            <div className={`p-3 rounded-xl bg-gradient-to-r ${level.color}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            
            {/* Title and Progress */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">{level.name}</h3>
                <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white">
                  {level.title}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">{level.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-sm text-zinc-400">Your Battles</div>
              <div className="text-xl font-bold text-white">{totalGames}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-sm text-zinc-400">Win Rate</div>
              <div className="text-xl font-bold text-white">{winRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Next Level Progress */}
          {level !== FUD_LEVELS[3] && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Progress to Next Level</span>
                <span className="text-white">
                  {totalGames} / {
                    totalGames < 6 ? '6' :
                    totalGames < 51 ? '51' :
                    totalGames < 501 ? '501' : '∞'
                  }
                </span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(
                    totalGames < 6 ? (totalGames / 6) * 100 :
                    totalGames < 51 ? (totalGames / 51) * 100 :
                    totalGames < 501 ? (totalGames / 501) * 100 : 100
                  , 100)}%` }}
                  className={`h-full bg-gradient-to-r ${level.color}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function FUDerboard() {
  const { address, isLoggedIn } = useWallet();
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'winRate' | 'totalGames'>('totalGames');
  const [isLoading, setIsLoading] = useState(true);
  const { network } = useGetNetworkConfig();

  const fetchScoreboard = async () => {
    try {
      setIsLoading(true);
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getScoreboard"),
        args: [BytesValue.fromHex('202e')]
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getScoreboard");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);

      const scoreboardData = values[0].valueOf().map((score: any) => ({
        address: score.address.toString(),
        wins: Number(score.wins.toString()),
        losses: Number(score.losses.toString())
      }));

      setScores(scoreboardData);

      // Calculate totals
      const totals = scoreboardData.reduce(
        (acc: { wins: number; losses: number }, curr: PlayerScore) => ({
          wins: acc.wins + curr.wins,
          losses: acc.losses + curr.losses
        }),
        { wins: 0, losses: 0 }
      );

      setTotalWins(totals.wins);
      setTotalLosses(totals.losses);
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, [network.apiAddress]);

  // Filter and sort scores
  const filteredAndSortedScores = scores
    .filter(score => 
      searchQuery ? score.address.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .map(score => ({
      ...score,
      totalGames: score.wins + score.losses,
      winRate: score.wins + score.losses > 0
        ? (score.wins / (score.wins + score.losses)) * 100
        : 0
    }))
    .sort((a, b) => 
      sortBy === 'winRate' 
        ? b.winRate - a.winRate
        : b.totalGames - a.totalGames
    );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedScores.length / ITEMS_PER_PAGE);
  const paginatedScores = filteredAndSortedScores.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-black pt-[80px]">
      <RetroGrid />
      <div className="relative z-10 px-4 sm:px-6">
        {/* Player Status - Shown when connected */}
        {isLoggedIn && address && (
          <PlayerStatus scores={scores} address={address} />
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl border border-zinc-800 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C99733]/10 to-transparent rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#FFD163]/10 to-transparent rounded-full blur-3xl -z-10" />

            {/* Header */}
            <div className="mb-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <Trophy className="w-6 h-6 text-[#FFD163]" />
                <h1 className="text-2xl font-bold text-white">FUDerboard</h1>
              </motion.div>
              <p className="text-zinc-400">Where FUD turns into glory</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm"
              >
                <div className="text-sm text-zinc-400 mb-1">Total Games Played</div>
                <div className="text-2xl font-bold text-[#FFD163]">{Math.floor((totalWins + totalLosses) / 2)}</div>
              </motion.div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm"
              >
                <div className="text-sm text-zinc-400 mb-1">Total Players</div>
                <div className="text-2xl font-bold text-[#FFD163]">{scores.length}</div>
              </motion.div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm"
              >
                <div className="text-sm text-zinc-400 mb-1">Average Win Rate</div>
                <div className="text-2xl font-bold text-[#FFD163]">
                  {scores.length > 0 
                    ? (scores.reduce((acc, curr) => {
                        const winRate = curr.wins + curr.losses > 0
                          ? (curr.wins / (curr.wins + curr.losses)) * 100
                          : 0;
                        return acc + winRate;
                      }, 0) / scores.length).toFixed(1)
                    : '0.0'}%
                </div>
              </motion.div>
            </div>

            {/* Search and Sort */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <input
                type="text"
                placeholder="Search by ERD address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-black/20 border border-zinc-800 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFD163] transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortBy('totalGames')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    sortBy === 'totalGames' 
                      ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black shadow-lg' 
                      : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
                >
                  Sort by Games
                </button>
                <button 
                  onClick={() => setSortBy('winRate')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    sortBy === 'winRate' 
                      ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black shadow-lg' 
                      : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
                >
                  Sort by Win Rate
                </button>
              </div>
            </motion.div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Rank</th>
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Player</th>
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Total Games</th>
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-400">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="inline-block"
                        >
                          <Trophy className="w-6 h-6" />
                        </motion.div>
                        <p className="mt-2">Loading leaderboard...</p>
                      </td>
                    </tr>
                  ) : paginatedScores.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-400">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    paginatedScores.map((score, index) => {
                      const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                      return (
                        <motion.tr 
                          key={score.address}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-zinc-800/50 hover:bg-black/20 transition-colors"
                        >
                          <td className="py-4 px-4 text-zinc-400">
                            <div className="flex items-center gap-2">
                              {getRankIcon(absoluteIndex)}
                              #{absoluteIndex + 1}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[#FFD163]">{formatAddress(score.address)}</td>
                          <td className="py-4 px-4 text-white">{score.totalGames}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score.winRate}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-[#C99733] to-[#FFD163]"
                                />
                              </div>
                              <span className="text-white">{score.winRate.toFixed(1)}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-xl hover:bg-black/20"
              >
                Previous
              </button>
              <div className="text-zinc-400">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-xl hover:bg-black/20"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 