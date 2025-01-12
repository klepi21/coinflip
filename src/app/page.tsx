'use client'

import { motion } from 'framer-motion';
import { ArrowRight, Code2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
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
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-bold bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent mb-6"
            >
              MultiversX
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/60 mb-8"
            >
              Welcome to the future of decentralized finance
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link 
                href="/liquid-funds"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 
                         text-white rounded-lg transition-colors"
              >
                Explore Funds
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Secure by Default",
                description: "Built with security best practices and integrated with trusted MultiversX SDKs."
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "High Performance",
                description: "Optimized for speed and efficiency with the latest blockchain technology."
              },
              {
                icon: <Code2 className="h-6 w-6" />,
                title: "Developer Ready",
                description: "Everything you need to start building your dApp immediately."
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}