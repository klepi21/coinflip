'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  hash: string;
  timestamp: number;
  action: 'buy' | 'sell';
  amount: string;
  address: string;
  value: string;
  token: 'EGLD' | 'USDC';
}

interface RecentTransactionsProps {
  fundAddress: string;
}

// Add USDC identifier constant
const USDC_IDENTIFIER = 'USDC-c76f1f';

export const RecentTransactions = ({ fundAddress }: RecentTransactionsProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `https://devnet-api.multiversx.com/accounts/${fundAddress}/transactions?size=3&status=success`
        );
        const data = await response.json();
        
        const processedTxs = data
          .filter((tx: any) => tx.status === 'success')
          .slice(0, 5)
          .map((tx: any) => {
            const egldAmount = (Number(tx.value) / 1e18).toFixed(4);
            
            let action: 'buy' | 'sell' = 'buy';
            if (tx.function === 'withdraw' || tx.function === 'sell') {
              action = 'sell';
            }
            
            return {
              hash: tx.txHash,
              timestamp: tx.timestamp,
              action,
              amount: egldAmount,
              address: tx.sender,
              value: tx.value,
              token: 'EGLD'
            };
          });
        
        setTransactions(processedTxs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [fundAddress]);

  return (
    <div className="space-y-4">
      {transactions.slice(0, 3).map((tx, index) => (
        <Link
          key={tx.hash}
          href={`https://devnet-explorer.multiversx.com/transactions/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/20 rounded-xl p-4 border border-white/5 hover:border-white/10 
                       hover:bg-black/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-xl ${
                tx.action === 'buy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}>
                {tx.action === 'buy' ? (
                  <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {tx.action === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                  <span className={`text-sm font-medium ${
                    tx.action === 'buy' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {Number(tx.amount) === 0 ? 'USDC' : `${tx.amount} ${tx.token}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/40">
                    {tx.address.slice(0, 6)}...{tx.address.slice(-6)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(tx.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}; 