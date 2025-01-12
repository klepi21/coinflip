'use client'

import { LiquidFundsTable } from '@/components/liquidfunds/LiquidFundsTable';
import { motion } from 'framer-motion';

export default function LiquidFundsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="mb-12">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent mb-6">
              Liquid Funds
            </h1>
            <p className="text-xl text-white/60">
              Explore our selection of professionally managed index funds
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <LiquidFundsTable />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 