const TOKEN_IDENTIFIERS: Record<string, string> = {
  'HUSDC': 'HUSDC-7c1ef2',
  'HBTC': 'HBTC-c21c4e',
  'HETH': 'HETH-f93d9a',
  'EGLD': 'WEGLD-d7c6bb',
  'HTM': 'HTM-f30d6f',
  'HMEX': 'HMEX-4e8710',
  'HASH': 'HASH-18e101',
  'HLKMEX': 'HLKMEX-4e8710',
  'HUSDT': 'HUSDT-f750c2',
  'HBUSD': 'HBUSD-052e94'
};

// Add default token colors for tokens without icons
const DEFAULT_TOKEN_COLORS: Record<string, string> = {
  'HUSDC': '#2775CA',  // USDC blue
  'HBTC': '#F7931A',   // Bitcoin orange
  'HETH': '#627EEA',   // Ethereum blue
  'EGLD': '#23F7DD',   // EGLD teal
  'HTM': '#FF5733',    // Hatom orange
  'HMEX': '#00FF00',   // MEX green
  'HASH': '#9B59B6',   // ASH purple
  'HLKMEX': '#00FF00', // LKMEX green
  'HUSDT': '#26A17B',  // USDT green
  'HBUSD': '#F0B90B',  // BUSD yellow
  'default': '#6B7280'  // Gray for unknown tokens
};

export const getTokenIconUrl = (tokenIdentifier: string) => {
  try {
    // Use the full token identifier directly
    return `https://tools.multiversx.com/assets-cdn/devnet/tokens/${tokenIdentifier}/icon.png`;
  } catch (error) {
    // Fallback to a generic token icon with first letter
    const letter = tokenIdentifier.charAt(0);
    const color = '#6B7280'; // Default gray color
    
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="24" fill="${color}"/>
      <text x="24" y="28" font-size="20" fill="white" text-anchor="middle" font-family="Arial">${letter}</text>
    </svg>`;
  }
}; 