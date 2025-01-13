'use client';

export const TokenDetails = ({ details }: { details: any }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[420px]">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-medium text-white">Token Details</h2>
      </div>
      <div className="space-y-4">
        <div className="bg-black/20 rounded-xl p-4">
          <div className="text-sm text-white/60 mb-2">Fund Token ID</div>
          <div className="text-white font-mono">{details.fundTokenId}</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className="text-sm text-white/60 mb-2">Smart Contract</div>
          <div className="text-white font-mono">{details.address}</div>
        </div>
      </div>
    </div>
  );
}; 