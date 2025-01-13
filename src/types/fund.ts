interface Token {
  identifier: string;
  balance: string;
  decimals: number;
  weight: number;
  apr: string | number;
}

interface Fund {
  // ... existing properties
  tokens: Token[];
} 