import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonCtaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  className?: string;
}

function ButtonCta({ label = "Get Access", className, ...props }: ButtonCtaProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "group relative w-1/2 h-12 px-4 rounded-lg overflow-hidden transition-all duration-500",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-lg p-[2px] bg-gradient-to-b from-white/50 via-white/20 to-white/50">
        <div className="absolute inset-0 bg-black/20 rounded-lg opacity-90" />
      </div>

      <div className="absolute inset-[2px] bg-black/20 rounded-lg opacity-95" />

      <div className="absolute inset-[2px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg opacity-90" />
      <div className="absolute inset-[2px] bg-gradient-to-b from-white/30 via-white/10 to-white/30 rounded-lg opacity-80" />
      <div className="absolute inset-[2px] bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-lg" />

      <div className="absolute inset-[2px] shadow-[inset_0_0_15px_rgba(255,255,255,0.15)] rounded-lg" />

      <div className="relative flex items-center justify-center gap-2">
        <span className="text-lg font-light text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] tracking-tighter">
          {label}
        </span>
      </div>

      <div className="absolute inset-[2px] opacity-0 transition-opacity duration-300 bg-gradient-to-r from-white/10 via-white/20 to-white/10 group-hover:opacity-100 rounded-lg" />
    </Button>
  );
}

export { ButtonCta }; 