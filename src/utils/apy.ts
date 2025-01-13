export const WAD = BigInt('1000000000000000000');
export const SECONDS_PER_YEAR = 31556926;

export const calculateApy = (aprValue: string) => {
  if (!aprValue) return 0;
  const apr = Number(aprValue) / Number(WAD);
  return (Math.pow(1 + apr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
};

export const calculateWeightedAverageApy = (tokens: any[]) => {
  if (!tokens || tokens.length === 0) return 0;
  
  const weightedApys = tokens.map(token => {
    const apy = calculateApy(token.apr);
    const weight = token.weight;
    return apy * weight;
  });

  return weightedApys.reduce((sum, weightedApy) => sum + weightedApy, 0);
}; 