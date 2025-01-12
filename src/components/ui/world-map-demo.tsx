"use client";
import { WorldMap } from "@/components/ui/world-map";
import { motion } from "framer-motion";

export function WorldMapDemo() {
  return (
    <div className="py-40 dark:bg-black bg-white w-full">
      <div className="max-w-7xl mx-auto text-center">
        <p className="font-bold text-xl md:text-4xl dark:text-white text-black">
          CRYPTOMURMURA
          <span className="text-neutral-400">
            {"2.0".split("").map((word, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </p>
        <p className="text-sm md:text-lg text-neutral-500 max-w-2xl mx-auto py-4">
          Start building decentralized applications with this production-ready template.
          Connect wallets, interact with smart contracts, and create amazing experiences.
        </p>
      </div>
      <WorldMap
        dots={[
          {
            start: { lat: 51.5074, lng: -0.1278 }, // London
            end: { lat: 40.7128, lng: -74.0060 }, // New York
          },
          {
            start: { lat: 35.6762, lng: 139.6503 }, // Tokyo
            end: { lat: 1.3521, lng: 103.8198 }, // Singapore
          },
          {
            start: { lat: 48.8566, lng: 2.3522 }, // Paris
            end: { lat: 25.2048, lng: 55.2708 }, // Dubai
          },
          {
            start: { lat: 40.4168, lng: -3.7038 }, // Madrid
            end: { lat: -33.8688, lng: 151.2093 }, // Sydney
          },
          {
            start: { lat: 52.5200, lng: 13.4050 }, // Berlin
            end: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          },
        ]}
        lineColor="#22c55e" // Using a green color to match your theme
      />
    </div>
  );
} 