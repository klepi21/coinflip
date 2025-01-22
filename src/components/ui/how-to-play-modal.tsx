'use client'

import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-2xl bg-gradient-to-r from-[#C99733] to-[#FFD163] p-6 shadow-xl border-2 border-black">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-2xl font-bold text-black">How to Play</Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="space-y-4 text-black">
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">👋 Welcome to MINCU Fight!</h3>
              <p>Here's how to play:</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/10 rounded-xl border border-black/20">
                <h4 className="font-semibold">1. Create or Join a Game 🎮</h4>
                <p className="mt-1">
                  • To Create: Click "Create Game", set your bet amount and pick a side<br/>
                  • To Join: Find an open game and click "Join Game"<br/>
                  • Entry fee is your bet - make sure you have enough MINCU!
                </p>
              </div>

              <div className="p-4 bg-black/10 rounded-xl border border-black/20">
                <h4 className="font-semibold">2. The Game Process 🤝</h4>
                <p className="mt-1">
                  • If you created: Wait for someone to join your game<br/>
                  • If you joined: The game starts automatically<br/>
                  • Once two players are in, winner is chosen randomly
                </p>
              </div>

              <div className="p-4 bg-black/10 rounded-xl border border-black/20">
                <h4 className="font-semibold">3. Rewards 💰</h4>
                <p className="mt-1">
                  • Winners get 1.95x their betting amount!<br/>
                  • Example: Bet 1000 MINCU → Win 1950 MINCU<br/>
                  • Winnings are sent automatically to your wallet
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-black/20 rounded-xl border border-black/20">
              <p className="font-semibold">💡 Quick Tips:</p>
              <ul className="space-y-1 mt-2">
                <li>• You can cancel your created game if no one has joined yet</li>
                <li>• Higher bets = higher potential winnings</li>
                <li>• Make sure you have enough MINCU tokens before playing</li>
              </ul>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 