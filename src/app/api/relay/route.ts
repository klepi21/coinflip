'use server';

import { NextResponse } from 'next/server';
import { UserSigner } from "@multiversx/sdk-wallet";
import {
  Address,
  Transaction,
  RelayedTransactionV2Builder,
  Account,
  TransactionPayload,
} from "@multiversx/sdk-core";
import { ApiNetworkProvider, ProxyNetworkProvider } from "@multiversx/sdk-network-providers";

const DEVNET_GATEWAY = 'https://devnet-gateway.multiversx.com';
const DEVNET_API = 'https://devnet-api.multiversx.com';
const BOD_GAME_SC = 'erd1qqqqqqqqqqqqqpgq8dcdymtj8a3wu92z6w25gjw72swnte2zu7zs6cvd7y';
const CHAIN_ID = 'D';

const proxyNetworkProvider = new ProxyNetworkProvider(DEVNET_GATEWAY);
const apiNetworkProvider = new ApiNetworkProvider(DEVNET_API);

export async function POST(request: Request) {
  const { userAddress, selectedAmount } = await request.json();

  try {
    // 1. Get relayer credentials from env
    const relayerAddress = process.env.RELAYER_ADDRESS;
    const relayerPem = process.env.RELAYER_PEM;

    if (!relayerAddress || !relayerPem) {
      return NextResponse.json({ error: 'Relayer credentials not configured' }, { status: 400 });
    }

    console.log('Relayer Address:', relayerAddress);
    console.log('Relayer PEM:', relayerPem);

    // 2. Prepare the inner transaction data
    const userAddressHex = Buffer.from(userAddress).toString('hex');
    const txData = `ESDTTransfer@${selectedAmount}@${userAddressHex}`;

    // 3. Sign the tx data with our wallet
    const pemDecoded = Buffer.from(relayerPem, 'utf8').toString('utf8');
    const signer = UserSigner.fromPem(pemDecoded);
    const signature = await signer.sign(Buffer.from(txData));

    // 4. Get relayer account info
    const relayerAcc = new Account(new Address(relayerAddress));
    const relayerOnNetwork = await apiNetworkProvider.getAccount(new Address(relayerAddress));
    relayerAcc.update(relayerOnNetwork);

    // 5. Build the relayed transaction
    const networkConfig = {
      MinGasLimit: 50000,
      GasPerDataByte: 1500,
      GasPriceModifier: 0.01,
      ChainID: CHAIN_ID
    };

    // Create the inner transaction first
    const innerTx = new Transaction({
      data: new TransactionPayload(
        `relayedTxV2@${BOD_GAME_SC}@${relayerAcc.nonce.toString()}@${txData}@${signature.toString('hex')}`
      ),
      receiver: new Address(BOD_GAME_SC),
      gasLimit: 50000000,
      chainID: CHAIN_ID,
      sender: new Address(relayerAddress),
      value: '0'
    });

    const relayedTx = new RelayedTransactionV2Builder()
      .setInnerTransaction(innerTx)
      .setInnerTransactionGasLimit(50000000)
      .setRelayerAddress(new Address(relayerAddress))
      .setRelayerNonce(relayerAcc.nonce)
      .setNetworkConfig(networkConfig)
      .build();

    // 6. Sign and send the relayed transaction
    const serializedTx = relayedTx.serializeForSigning();
    const txSignature = await signer.sign(serializedTx);
    relayedTx.applySignature(txSignature);

    const hash = await proxyNetworkProvider.sendTransaction(relayedTx);
    return NextResponse.json({ sessionId: hash });

  } catch (error) {
    console.error('Relay transaction error:', error);
    return NextResponse.json({ error: 'Relay transaction failed' }, { status: 500 });
  }
} 