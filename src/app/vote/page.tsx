'use client';

import { motion } from "framer-motion";

export default function Vote() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Content will be added later */}
      </motion.div>
    </div>
  );
} 