import { motion } from "framer-motion";
import Image from "next/image";

interface GlovesAnimationProps {
  onComplete?: () => void;
}

export function GlovesAnimation({ onComplete }: GlovesAnimationProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: [0, 1.2, 1],
          rotate: [-180, 0],
        }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
        }}
        onAnimationComplete={onComplete}
        className="relative w-32 h-32"
      >
        <Image
          src="/img/gloves.png"
          alt="Boxing Gloves"
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
} 