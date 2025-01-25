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
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

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

  // If not connected or not admin, show forbidden message
  if (!address || !ADMIN_ADDRESSES.includes(address)) {
    return (
      <main className="relative h-screen overflow-hidden bg-black">
        <RetroGrid />
        <div className="h-full overflow-auto pt-24">
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
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <div className="h-full overflow-auto pt-24">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Game Statistics</h2>
                <p className="text-zinc-400">Player performance overview</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-zinc-400">Total Wins</h3>
                  <p className="text-2xl font-bold text-[#C99733]">{totalWins}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-zinc-400">Total Losses</h3>
                  <p className="text-2xl font-bold text-[#C99733]">{totalLosses}</p>
                </div>
              </div>

              {/* Scoreboard Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">Player</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-medium">Wins</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-medium">Losses</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-medium">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((score, index) => {
                      const winRate = score.wins + score.losses > 0
                        ? ((score.wins / (score.wins + score.losses)) * 100).toFixed(1)
                        : '0.0';

                      return (
                        <tr key={score.address} className="border-b border-zinc-800/50">
                          <td className="py-3 px-4 text-white font-medium">
                            <span className="text-sm">{score.address.slice(0, 8)}...{score.address.slice(-4)}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-[#C99733]">{score.wins}</td>
                          <td className="py-3 px-4 text-center text-zinc-400">{score.losses}</td>
                          <td className="py-3 px-4 text-center text-white">{winRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 