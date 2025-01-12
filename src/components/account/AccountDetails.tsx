import React from 'react';
import { Coins, CreditCard, Database } from 'lucide-react';
import { AccountDetailItem } from './AccountDetailItem';
import { IAddress } from '@multiversx/sdk-core';

interface AccountDetailsProps {
  address: string;
  balance: string;
  nonce: number;
  shard: number;
}

export const AccountDetails = ({
  address,
  balance,
  nonce,
  shard
}: AccountDetailsProps) => {
  return (
    <div className="space-y-4">
      <AccountDetailItem
        icon={<Database className="h-5 w-5" />}
        label="Address"
        value={address}
      />
      <AccountDetailItem
        icon={<Coins className="h-5 w-5" />}
        label="Balance"
        value={balance}
      />
      <AccountDetailItem
        icon={<CreditCard className="h-5 w-5" />}
        label="Nonce"
        value={nonce.toString()}
      />
      <AccountDetailItem
        icon={<Database className="h-5 w-5" />}
        label="Shard"
        value={shard.toString()}
      />
    </div>
  );
};