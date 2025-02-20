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
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import { toast, Toaster } from 'sonner';
import gameAbi from '@/config/game.abi.json';
import { getContractForShard } from '@/config/wof-contracts';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const ADMIN_ADDRESSES = ['erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4', 'erd1vvms6vgu0r6he4p20jp7z99wcrwwuk06rwey670kmszg4c7yfhws43xpxp','erd12xqam5lxx6xeteaewx25xarqd3ypleetkv35w40nuqchsxqar9zqkslg66'];

// Add WoF constants
const WOF_SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqrmqqsq5aa9rnmaecfcepyuy9cdsfzh07fhwsjz80m6';

interface PlayerScore {
  address: string;
  wins: number;
  losses: number;
}

interface WofPlayerStats {
  address: string;
  totalPlayed: string;
  totalWon: string;
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
  const [newToken, setNewToken] = useState('');
  const [minimumAmountToken, setMinimumAmountToken] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [scoreboard, setScoreboard] = useState<PlayerScore[]>([]);
  const [wofStats, setWofStats] = useState<WofPlayerStats[]>([]);
  const [isLoadingWof, setIsLoadingWof] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedShard, setSelectedShard] = useState(0);

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

  const fetchWofStats = async () => {
    try {
      setIsLoadingWof(true);
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(WOF_SC_ADDRESS),
        abi: AbiRegistry.create(gameAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getPlayersReport"),
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getPlayersReport");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      if (values?.[0]) {
        const stats = values[0].valueOf().map((stat: any) => ({
          address: stat.address.toString(),
          totalPlayed: stat.total_played.toString(),
          totalWon: stat.total_won.toString()
        }));

        // Sort by total played
        stats.sort((a: WofPlayerStats, b: WofPlayerStats) => 
          Number(BigInt(b.totalPlayed)) - Number(BigInt(a.totalPlayed))
        );

        setWofStats(stats);
      }
    } catch (error) {
      console.error('Error fetching WoF stats:', error);
    } finally {
      setIsLoadingWof(false);
    }
  };

  useEffect(() => {
    if (ADMIN_ADDRESSES.includes(address)) {
      fetchScoreboard();
      fetchWofStats();
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

  const handleEndVoting = async () => {
    try {
      const data = 'endVoting';
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Ending voting session...',
          errorMessage: 'An error occurred while ending voting',
          successMessage: 'Successfully ended voting session!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('Voting session ended successfully');
      }
    } catch (error) {
      console.error('Error ending voting:', error);
      toast.error('Failed to end voting session');
    }
  };

  const handleStartVoting = async () => {
    try {
      // Convert 4 to hex: 04
      const votingOptions = '04';
      const data = `startVoting@${votingOptions}`;
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Starting new voting session...',
          errorMessage: 'An error occurred while starting voting',
          successMessage: 'Successfully started new voting session!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('New voting session started successfully');
      }
    } catch (error) {
      console.error('Error starting voting:', error);
      toast.error('Failed to start voting session');
    }
  };

  const handleEndTokenVoting = async () => {
    try {
      const data = 'endTokenVoting';
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Ending token voting session...',
          errorMessage: 'An error occurred while ending token voting',
          successMessage: 'Successfully ended token voting session!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('Token voting session ended successfully');
      }
    } catch (error) {
      console.error('Error ending token voting:', error);
      toast.error('Failed to end token voting session');
    }
  };

  const handleStartTokenVoting = async () => {
    try {
      // Convert 4 to hex: 04
      const votingOptions = '04';
      const data = `startTokenVoting@${votingOptions}`;
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Starting new token voting session...',
          errorMessage: 'An error occurred while starting token voting',
          successMessage: 'Successfully started new token voting session!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('New token voting session started successfully');
      }
    } catch (error) {
      console.error('Error starting token voting:', error);
      toast.error('Failed to start token voting session');
    }
  };

  const handleAddToken = async () => {
    try {
      if (!newToken) {
        toast.error('Please enter a token identifier');
        return;
      }

      // Convert token identifier to hex
      const tokenHex = Buffer.from(newToken).toString('hex');
      const data = `addTokens@${tokenHex}`;
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Adding new token...',
          errorMessage: 'An error occurred while adding token',
          successMessage: 'Successfully added new token!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('Token added successfully');
        setNewToken(''); // Clear input
      }
    } catch (error) {
      console.error('Error adding token:', error);
      toast.error('Failed to add token');
    }
  };

  const handleSetMinimumAmount = async () => {
    try {
      if (!minimumAmountToken || !minimumAmount) {
        toast.error('Please enter both token identifier and amount');
        return;
      }

      // Convert token identifier to hex
      const tokenHex = Buffer.from(minimumAmountToken).toString('hex');
      // Convert amount to hex (assuming it's a number)
      const amountHex = BigInt(minimumAmount).toString(16).padStart(16, '0');
      
      const data = `setMinimumAmount@${tokenHex}@${amountHex}`;
      
      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Setting minimum amount...',
          errorMessage: 'An error occurred while setting minimum amount',
          successMessage: 'Successfully set minimum amount!'
        }
      });

      if (sessionId) {
        await refreshAccount();
        toast.success('Minimum amount set successfully');
        setMinimumAmountToken(''); // Clear inputs
        setMinimumAmount('');
      }
    } catch (error) {
      console.error('Error setting minimum amount:', error);
      toast.error('Failed to set minimum amount');
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
              className="w-full space-y-6"
            >
              {/* Admin Controls Section */}
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 mb-6">
                <div className="space-y-2 mb-4">
                  <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
                  <p className="text-zinc-400">Manage voting sessions</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fighter Voting Controls */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Fighter Voting</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={handleEndVoting}
                        className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                      >
                        End Fighter Vote
                      </button>
                      <button
                        onClick={handleStartVoting}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium hover:opacity-90 transition-opacity"
                      >
                        Start Fighter Vote (4)
                      </button>
                    </div>
                  </div>

                  {/* Token Voting Controls */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Token Voting</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={handleEndTokenVoting}
                        className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                      >
                        End Token Vote
                      </button>
                      <button
                        onClick={handleStartTokenVoting}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium hover:opacity-90 transition-opacity"
                      >
                        Start Token Vote (4)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Management Section */}
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6">
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl font-bold text-white">Token Management</h2>
                  <p className="text-zinc-400">Manage accepted tokens and minimum amounts</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add Token Control */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Add Token</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Token identifier (e.g. RARE-99e8b0)"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className="flex-1 px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                      />
                      <button
                        onClick={handleAddToken}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Add Token
                      </button>
                    </div>
                  </div>

                  {/* Set Minimum Amount Control */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Set Minimum Amount</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Token identifier"
                        value={minimumAmountToken}
                        onChange={(e) => setMinimumAmountToken(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Minimum amount"
                          value={minimumAmount}
                          onChange={(e) => setMinimumAmount(e.target.value)}
                          className="flex-1 px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                        />
                        <button
                          onClick={handleSetMinimumAmount}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          Set Amount
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
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

              {/* Wheel of Fomo Stats */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-white mb-6">Wheel of Fomo Stats</h2>
                <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
                  {/* Add Deposit Section */}
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Deposit EGLD to Wheel of Fomo
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="Amount in EGLD"
                            className="flex-1 px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C99733]"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                          <select
                            value={selectedShard}
                            onChange={(e) => setSelectedShard(Number(e.target.value))}
                            className="px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700 text-white focus:outline-none focus:border-[#C99733]"
                          >
                            <option value={0}>Shard 0</option>
                            <option value={1}>Shard 1</option>
                            <option value={2}>Shard 2</option>
                          </select>
                          <button
                            onClick={async () => {
                              try {
                                if (!depositAmount || Number(depositAmount) <= 0) {
                                  toast.error('Please enter a valid amount');
                                  return;
                                }

                                // Get the contract address for the selected shard using the helper function
                                const contractAddress = getContractForShard(selectedShard);

                                const transaction = {
                                  value: (Number(depositAmount) * 10**18).toString(),
                                  data: 'addAmount',
                                  receiver: contractAddress,
                                  gasLimit: 60000000
                                };

                                const { sessionId } = await sendTransactions({
                                  transactions: [transaction],
                                  transactionsDisplayInfo: {
                                    processingMessage: 'Processing deposit...',
                                    errorMessage: 'An error occurred during deposit',
                                    successMessage: 'Successfully deposited EGLD!'
                                  }
                                });

                                if (sessionId) {
                                  await refreshAccount();
                                  setDepositAmount('');
                                  toast.success('Deposit successful!');
                                }
                              } catch (error) {
                                console.error('Error depositing:', error);
                                toast.error('Failed to deposit EGLD');
                              }
                            }}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            Deposit
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                          Selected contract: {getContractForShard(selectedShard)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLoadingWof ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-[#C99733] border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-zinc-400">Loading stats...</p>
                    </div>
                  ) : wofStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Rank</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Player</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">Total Played</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">Total Won (EGLD)</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">Win Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wofStats.map((player, index) => {
                            const totalPlayed = Number(BigInt(player.totalPlayed)) / 1e18;
                            const totalWon = Number(BigInt(player.totalWon)) / 1e18;
                            const winRate = totalPlayed > 0 ? (totalWon / totalPlayed) * 100 : 0;

                            return (
                              <tr 
                                key={player.address} 
                                className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-zinc-400">#{index + 1}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">
                                      {player.address.substring(0, 6)}...{player.address.substring(player.address.length - 4)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right text-white">{totalPlayed.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-white">{totalWon.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`text-sm font-medium ${
                                    winRate >= 50 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {winRate.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-400">
                      No stats available
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
} 