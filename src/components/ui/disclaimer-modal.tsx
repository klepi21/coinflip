'use client'

import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal = ({ isOpen, onClose }: DisclaimerModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-3xl bg-[#FD8803] p-8 shadow-2xl border-2 border-black max-w-md"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>

            {/* Content */}
            <div className="space-y-6">
              <Dialog.Title className="text-2xl font-bold text-black font-doggie">
                Disclaimer
              </Dialog.Title>

              <div className="space-y-4 text-black font-doggie">
                <p>
                  BOD Jackpot is an exciting platform offering a fair and transparent scratch lottery ticket experience. Players purchase tickets to reveal potential winnings, with outcomes determined by provable fairness.
                </p>
                <p>
                  Every result is generated transparently to ensure a trustworthy experience. Please play responsibly and ensure compliance with your local regulations.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full bg-[#FFA036] hover:bg-[#FFA036]/80 text-black rounded-full px-8 py-3 font-semibold transition-all duration-300 border-2 border-black font-doggie"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 