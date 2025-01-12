import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { AccountHeader } from './AccountHeader';
import { AccountDetails } from './AccountDetails';

export const AccountInfo = () => {
  const { address, account } = useGetAccountInfo();

  if (!address || !account) {
    return null;
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
      <AccountHeader />
      <AccountDetails 
        address={address}
        balance={account.balance.toString()}
        nonce={account.nonce ?? 0}
        shard={account.shard ?? 0}
      />
    </div>
  );
};