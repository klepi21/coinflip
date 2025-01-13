'use client';

import { useEffect, useState } from 'react';
import { Users, Trophy, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Holder {
  address: string;
  balance: string;
  percentage: number;
}

interface TopHoldersProps {
  fundAddress: string;
  fundTokenId: string;
}

export const TopHolders = ({ fundAddress, fundTokenId }: TopHoldersProps) => {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        // First fetch total supply
        const supplyResponse = await fetch(
          `https://devnet-api.multiversx.com/tokens/${fundTokenId}`
        );
        const supplyData = await supplyResponse.json();
        const totalSupply = BigInt(supplyData.supply);

        // Then fetch holders
        const response = await fetch(
          `https://devnet-api.multiversx.com/tokens/${fundTokenId}/accounts?size=4`
        );
        const data = await response.json();
        
        // Process holders data with proper percentage calculation
        const processedHolders = data.map((holder: any) => {
          const holderBalance = BigInt(holder.balance);
          return {
            address: holder.address || '',
            balance: (Number(holderBalance) / 1e18).toFixed(2),
            percentage: 0 // Keep this just for type safety
          };
        });
        
        setHolders(processedHolders);
      } catch (error) {
        console.error('Error fetching holders:', error);
        setHolders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolders();
  }, [fundAddress, fundTokenId]);

  return (
    <div className="space-y-4">
      {holders.slice(0, 3).map((holder, index) => (
        <Link
          key={holder.address}
          href={`https://devnet-explorer.multiversx.com/accounts/${holder.address}`}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl
                           bg-primary/10 text-primary font-bold">
                {index + 1}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {holder.address.slice(0, 8)}...{holder.address.slice(-8)}
                </div>
                <div className="text-xs text-white/40">
                  {holder.balance} shares
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}; 