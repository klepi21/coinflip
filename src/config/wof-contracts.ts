export const WOF_CONTRACTS = {
  SHARD_0: 'erd1qqqqqqqqqqqqqpgqragpqvxgg26l2y9q57khf46kyflmvx7877kqk2vfpg',
  SHARD_1: 'erd1qqqqqqqqqqqqqpgqrmqqsq5aa9rnmaecfcepyuy9cdsfzh07fhwsjz80m6',
  SHARD_2: 'erd1qqqqqqqqqqqqqpgq5kxansq6jedhyav3nfwk5rtdursgvwhsjfeqtq8ykn'
};

export const getContractForShard = (shard: number): string => {
  switch (shard) {
    case 0:
      return WOF_CONTRACTS.SHARD_0;
    case 1:
      return WOF_CONTRACTS.SHARD_1;
    case 2:
      return WOF_CONTRACTS.SHARD_2;
    default:
      throw new Error(`Invalid shard number: ${shard}`);
  }
}; 