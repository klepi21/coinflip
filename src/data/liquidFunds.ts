export interface LiquidFund {
  id: string;
  name: string;
  description: string;
  tokens: string[];
  price: number;
  change24h: number;
  change7d: number;
  sinceInception: number;
  aum: number;
  apr: number;
}

export const liquidFunds: LiquidFund[] = [
  {
    id: '1',
    name: 'MultiversX DeFi',
    description: 'Top DeFi projects on MultiversX: Hatom, ASH, and MEX. Diversify your DeFi investments!',
    tokens: ['MEX', 'LKMEX', 'ASH'],
    price: 2.40,
    change24h: 7.71,
    change7d: 36.26,
    sinceInception: 139.45,
    aum: 8827.91,
    apr: 42.5
  },
  {
    id: '2',
    name: 'Path to Heaven',
    description: 'Invest in WBTC, WETH, and EGLD. Steady growth, minimal risk. The king of funds!',
    tokens: ['WBTC', 'WETH', 'EGLD'],
    price: 1.35,
    change24h: 3.02,
    change7d: 9.63,
    sinceInception: 34.74,
    aum: 1398.53,
    apr: 28.3
  }
]; 