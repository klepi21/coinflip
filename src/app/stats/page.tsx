'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction,
  BytesValue
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { RetroGrid } from '@/components/ui/retro-grid';
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { AshSwapWidget } from "@/components/ui/ashswapwidget";

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const ADMIN_ADDRESSES = ['erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4', 'erd1vvms6vgu0r6he4p20jp7z99wcrwwuk06rwey670kmszg4c7yfhws43xpxp'];

interface PlayerScore {
  address: string;
  wins: number;
  losses: number;
}

export default function Stats() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'winRate' | 'totalGames'>('winRate');
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const itemsPerPage = 10;

  const fetchScoreboard = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (ADMIN_ADDRESSES.includes(address)) {
      fetchScoreboard();
    }
  }, [network.apiAddress, address]);

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
  const totalPages = Math.ceil(filteredAndSortedScores.length / itemsPerPage);
  const paginatedScores = filteredAndSortedScores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <div className="h-full overflow-auto pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        </div>

        {(!address || !ADMIN_ADDRESSES.includes(address)) ? (
          <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
              <p className="text-zinc-400">You don't have permission to view this page.</p>
            </motion.div>
          </div>
        ) : (
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >

              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
                {/* <AshSwapWidget /> */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Game Statistics</h2>
                  <p className="text-zinc-400">Player performance overview</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-400">Total Games Played</h3>
                    <p className="text-2xl font-bold text-[#C99733]">{totalWins }</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-400">Total Players</h3>
                    <p className="text-2xl font-bold text-[#C99733]">{scores.length}</p>
                  </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by ERD address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('winRate')}
                      className={`px-4 py-2 rounded-xl ${
                        sortBy === 'winRate'
                          ? 'bg-[#C99733] text-black'
                          : 'bg-zinc-800/50 text-white'
                      }`}
                    >
                      Sort by Win Rate
                    </button>
                    <button
                      onClick={() => setSortBy('totalGames')}
                      className={`px-4 py-2 rounded-xl ${
                        sortBy === 'totalGames'
                          ? 'bg-[#C99733] text-black'
                          : 'bg-zinc-800/50 text-white'
                      }`}
                    >
                      Sort by Games
                    </button>
                  </div>
                </div>

                {/* Scoreboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Player</th>
                        <th className="text-center py-3 px-4 text-zinc-400 font-medium">Total Games</th>
                        <th className="text-center py-3 px-4 text-zinc-400 font-medium">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedScores.map((score) => {
                        const totalGames = score.wins + score.losses;
                        const winRate = totalGames > 0
                          ? ((score.wins / totalGames) * 100).toFixed(1)
                          : '0.0';

                        return (
                          <tr key={score.address} className="border-b border-zinc-800/50">
                            <td className="py-3 px-4 text-white font-medium">
                              <span className="text-sm">{score.address.slice(0, 8)}...{score.address.slice(-4)}</span>
                            </td>
                            <td className="py-3 px-4 text-center text-[#C99733]">{totalGames}</td>
                            <td className="py-3 px-4 text-center text-white">{winRate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl ${
                        currentPage === 1
                          ? 'bg-zinc-800/50 text-zinc-500'
                          : 'bg-zinc-800/50 text-white hover:bg-[#C99733] hover:text-black'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl ${
                        currentPage === totalPages
                          ? 'bg-zinc-800/50 text-zinc-500'
                          : 'bg-zinc-800/50 text-white hover:bg-[#C99733] hover:text-black'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
} 