'use client';

interface FeeStructureProps {
  fees: {
    protocol: Record<string, number>;
    manager: Record<string, number>;
  };
}

export const FeeStructure = ({ fees }: FeeStructureProps) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[420px]">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-medium text-white">Fee Structure</h2>
      </div>
      <div className="space-y-6">
        {['protocol', 'manager'].map((feeType) => (
          <div key={feeType} className="space-y-2">
            <div className="text-white/60">{feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fees</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(fees[feeType as keyof typeof fees]).map(([key, value]) => (
                <div key={key} className="bg-black/20 rounded-xl p-3">
                  <div className="text-sm text-white/60">{key}</div>
                  <div className="text-lg font-bold text-white">{value}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 