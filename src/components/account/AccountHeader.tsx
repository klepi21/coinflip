import React from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@multiversx/sdk-dapp/utils';

export const AccountHeader = () => {
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
      <button
        onClick={handleLogout}
        className="flex items-center text-red-600 hover:text-red-700 transition-colors"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Disconnect
      </button>
    </div>
  );
};