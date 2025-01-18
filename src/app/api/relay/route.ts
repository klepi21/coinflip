'use server';

import {
    Address,
    Account,
    Transaction,
    RelayedTransactionV2Builder,
    TransactionPayload,
    TransactionVersion
  } from "@multiversx/sdk-core";
  import { UserSigner } from "@multiversx/sdk-wallet";
  import { ApiNetworkProvider, ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
  import { NextResponse } from 'next/server';
  
  const DEVNET_GATEWAY = "https://devnet-gateway.multiversx.com";
  const DEVNET_API = "https://devnet-api.multiversx.com";
  const BOD_GAME_SC = "erd1qqqqqqqqqqqqqpgq8dcdymtj8a3wu92z6w25gjw72swnte2zu7zs6cvd7y";
  const CHAIN_ID = "D";
  
  const proxyNetworkProvider = new ProxyNetworkProvider(DEVNET_GATEWAY);
  const apiNetworkProvider = new ApiNetworkProvider(DEVNET_API);
  
  export async function POST(request: Request) {
    try {
      const { userAddress, amount } = await request.json();
      
      const result = await relayBuyTransaction(userAddress, amount);
      return NextResponse.json(result);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Failed to process transaction" },
        { status: 500 }
      );
    }
  }
  
  async function relayBuyTransaction(userAddress: string, amount: number) {
    try {
      const relayerAddress = process.env.NEXT_PUBLIC_RELAYER_ADDRESS;
      const relayerPem = process.env.NEXT_PUBLIC_RELAYER_PEM;
  
      if (!relayerAddress || !relayerPem) {
        throw new Error("Relayer credentials not configured");
      }
  
      const userAddressHex = Buffer.from(userAddress).toString("hex");
      const usdcAmount = Math.floor(amount * Math.pow(10, 6));
      const innerTxData = `ESDTTransfer@${Buffer.from("USDC-350c4e").toString("hex")}@${usdcAmount.toString(16)}@${Buffer.from("testBuy").toString("hex")}@${userAddressHex}`;
  
      const relayerAcc = new Account(new Address(relayerAddress));
      const relayerOnNetwork = await apiNetworkProvider.getAccount(relayerAcc.address);
      relayerAcc.update(relayerOnNetwork);
  
      const payload = TransactionPayload.fromEncoded(innerTxData);
      const innerTx = new Transaction({
        nonce: 0,
        value: "0",
        receiver: new Address(BOD_GAME_SC),
        sender: relayerAcc.address,
        gasLimit: 0,
        data: payload,
        chainID: CHAIN_ID,
        version: new TransactionVersion(1),
      });
  
      const relayedTx = new RelayedTransactionV2Builder()
        .setInnerTransaction(innerTx)
        .setInnerTransactionGasLimit(50000000)
        .setRelayerAddress(relayerAcc.address)
        .setRelayerNonce(relayerAcc.nonce)
        .setNetworkConfig({
          MinGasLimit: 50000,
          GasPerDataByte: 1500,
          GasPriceModifier: 0.01,
          ChainID: CHAIN_ID,
        })
        .build();
  
      const signer = UserSigner.fromPem(relayerPem);
      const signature = await signer.sign(relayedTx.serializeForSigning());
      relayedTx.applySignature(signature);
  
      const hash = await proxyNetworkProvider.sendTransaction(relayedTx);
      return { sessionId: hash };
    } catch (error) {
      console.error("Relay transaction error:", error);
      throw error;
    }
  }
  