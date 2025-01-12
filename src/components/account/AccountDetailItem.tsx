import React from 'react';

interface AccountDetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isAddress?: boolean;
}

export const AccountDetailItem = ({ icon, label, value, isAddress = false }: AccountDetailItemProps) => {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
      <div className="mr-3">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`${isAddress ? 'text-sm font-mono break-all' : 'text-lg font-semibold'}`}>
          {value}
        </p>
      </div>
    </div>
  );
};