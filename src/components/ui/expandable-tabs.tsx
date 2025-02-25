"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon | string;
  type?: never;
  url?: string;
  isHighlighted?: boolean;
  disabled?: boolean;
  countdownTo?: Date;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  url?: never;
  isHighlighted?: never;
  disabled?: never;
  countdownTo?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  activePath?: string;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

// Countdown timer component
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  React.useEffect(() => {
    // Debug log
    console.log('CountdownTimer mounted with target date:', targetDate);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      // Debug log
      console.log('Time difference in ms:', difference);
      
      if (difference <= 0) {
        console.log('Target date is in the past or now');
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      // Calculate hours, minutes and seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      const result = { hours, minutes, seconds };
      console.log('Calculated time left:', result);
      return result;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update the timer every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  return (
    <motion.div 
      className="px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-[#C99733] to-[#FFD163] rounded-full whitespace-nowrap shadow-md"
      initial={{ scale: 0.95 }}
      animate={{ scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {timeLeft.hours.toString().padStart(2, '0')}:
      {timeLeft.minutes.toString().padStart(2, '0')}:
      {timeLeft.seconds.toString().padStart(2, '0')}
    </motion.div>
  );
}

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  activePath,
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef(null);

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    const tab = tabs[index];
    // Don't allow selecting disabled tabs
    if ('disabled' in tab && tab.disabled) {
      return;
    }
    
    setSelected(selected === index ? null : index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-white/10" aria-hidden="true" />
  );

  const shouldShowTitle = (tab: TabItem, index: number) => {
    if (tab.type === 'separator') return false;
    if (tab.url === activePath) return true;
    if (selected === index) return true;
    if (index < tabs.length - 1) return true; // Show all except last (Fuderboard) by default
    return false;
  };

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background/5 p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const isActive = tab.url === activePath;
        const isSelected = selected === index;
        const showTitle = shouldShowTitle(tab, index);
        const isHighlighted = tab.isHighlighted && !isActive;
        const isDisabled = tab.disabled;

        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={showTitle}
            onClick={() => handleSelect(index)}
            disabled={isDisabled}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              isActive
                ? "bg-black/20"
                : isSelected
                ? "bg-black/20"
                : "text-white/60 hover:bg-black/20 hover:text-white",
              isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/60"
            )}
          >
            {typeof tab.icon === 'string' ? (
              <span className={cn(
                "text-xl",
                isActive && "text-[#FFD163]",
                isHighlighted && "animate-pulse"
              )}>{tab.icon}</span>
            ) : (
              <tab.icon 
                size={20} 
                className={cn(
                  isActive && "text-[#FFD163]",
                  isHighlighted && "animate-pulse"
                )}
              />
            )}
            
            <AnimatePresence>
              {showTitle && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className={cn(
                    "ml-2",
                    isActive ? "text-[#FFD163]" : "text-white",
                    isHighlighted && "text-[#FFD163]"
                  )}
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Countdown timer badge */}
            {tab.countdownTo && (
              <div className="absolute -top-2 -right-2">
                <CountdownTimer targetDate={tab.countdownTo} />
              </div>
            )}
            
            {/* Hot badge for highlighted items */}
            {isHighlighted && !tab.countdownTo && (
              <motion.span 
                className="absolute -top-1 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                HOT
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
} 