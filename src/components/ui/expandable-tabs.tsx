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
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  url?: never;
  isHighlighted?: never;
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
    if (tab.type === 'separator' || tab.disabled) return;
    
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
        const isDisabled = tab.disabled === true;

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
              isDisabled && "opacity-50 cursor-not-allowed"
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
                    isHighlighted && "text-[#FFD163]",
                    isDisabled && "text-white/50"
                  )}
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Hot badge for highlighted items */}
            {isHighlighted && !isDisabled && (
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