import { TrendingUp } from 'lucide-react';

// Add the APY calculation functions
const WAD = 1_000_000_000_000_000_000;
const SECONDS_PER_YEAR = 31556926;

const calculateApy = (aprValue: string | number) => {
  if (!aprValue) return 0;
  const apr = Number(aprValue);
  const apy = (Math.pow(1 + apr / WAD, SECONDS_PER_YEAR) - 1) * 100;
  return apy;
};

const calculateAverageApy = (tokens: Array<{ apr: string | number; weight: number }>) => {
  const weightedApys = tokens.map(token => {
    const apy = calculateApy(token.apr);
    return (apy * token.weight) / 100;
  });
  
  const averageApy = weightedApys.reduce((sum, apy) => sum + apy, 0);
  return averageApy;
};

interface FundCardProps {
  fund: {
    tokens: Array<{
      apr: string | number;
      weight: number;
    }>;
    // ... other fund properties
  };
}

export function FundCard({ fund }: FundCardProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">
            {calculateAverageApy(fund.tokens).toFixed(2)}% APY
          </span>
        </div>
      </div>
      {/* Rest of your card content */}
    </div>
  );
} 