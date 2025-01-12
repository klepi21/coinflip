'use client'

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SparklesCore } from '@/components/ui/sparkles';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { ButtonCta } from '@/components/ui/button-shiny';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_100%)]" />
        
        {/* Full page sparkles */}
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.5}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="h-[40rem] w-full flex flex-col items-center justify-center">
          <div className="h-40"> {/* Increased height for larger text */}
            <GooeyText
              texts={["Cryptomurmura 2.0", "Liquid Funds"]}
              morphTime={3.0}
              cooldownTime={1.5}
              className="font-bold text-white scale-150"
              textClassName="text-3xl md:text-4xl lg:text-5xl"
            />
          </div>

          <div className="w-[40rem] relative"> {/* Increased margin-top */}
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-12"
          >
            <ButtonCta
              label="Explore Funds"
              className="w-fit text-sm"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}