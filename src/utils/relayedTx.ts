import { Account, Address, Transaction, TransactionPayload, RelayedTransactionV2Builder } from "@multiversx/sdk-core";
import { parseUserKey, UserSigner } from "@multiversx/sdk-wallet";
import { sendTransactions } from "@multiversx/sdk-dapp/services";


const RELAYER_ADDRESS = process.env.NEXT_PUBLIC_RELAYER_ADDRESS!;
const RELAYER_PEM = process.env.NEXT_PUBLIC_RELAYER_PEM!;

const formatPem = (pem: string) => {
  // Remove any existing headers/footers and whitespace
  const cleanPem = pem
    .replace(/-----BEGIN[^-]+-----/, '')
    .replace(/-----END[^-]+-----/, '')
    .replace(/\s/g, '');
    
  // Base64 decode and re-encode to ensure proper format
  const decoded = Buffer.from(cleanPem, 'base64');
  const encoded = decoded.toString('base64');

  return `-----BEGIN PRIVATE KEY-----\n${encoded}\n-----END PRIVATE KEY-----`;
};

export const createRelayedTxV2 = async (
  userAddress: string,
  tokenId: string,
  amount: number,
  scAddress: string
) => {
  try {
    // Get nonces for both addresses
    const [relayerResponse, userResponse] = await Promise.all([
      fetch(`https://devnet-api.multiversx.com/accounts/${RELAYER_ADDRESS}`),
      fetch(`https://devnet-api.multiversx.com/accounts/${userAddress}`)
    ]);
    
    const relayerData = await relayerResponse.json();
    const userData = await userResponse.json();

    // Create inner transaction with relayer's nonce
    const innerTx = new Transaction({
      sender: new Address(userAddress),
      receiver: new Address(RELAYER_ADDRESS),
      value: 0,
      gasLimit: 0,
      nonce: userData.nonce,
      data: new TransactionPayload(`ESDTTransfer@${Buffer.from(tokenId).toString('hex')}@${amount.toString(16).padStart(16, '0')}@${Buffer.from('testBuy').toString('hex')}@${new Address(userAddress).hex()}`),
      chainID: 'D',
      version: 2
    });

    // Return the unsigned transaction for the user to sign
    innerTx.setSender(new Address(userAddress));


    


    // Build relayed transaction with user's nonce
    const builder = new RelayedTransactionV2Builder();
    const relayedTx = builder
      .setInnerTransaction(innerTx)
      .setInnerTransactionGasLimit(20000000)
      .setRelayerNonce(relayerData.nonce)
      .setNetworkConfig({
        MinGasLimit: 50000,
        GasPerDataByte: 1500,
        GasPriceModifier: 0.01,
        ChainID: 'D'
      })
      .setRelayerAddress(new Address(RELAYER_ADDRESS))
      .build();

    // Set sender and sign
    relayedTx.setSender(new Address(RELAYER_ADDRESS));
    const pemKey = RELAYER_PEM.replace(/\\n/g, '\n'); // Handle newlines in env var
    const signer = new UserSigner(parseUserKey(formatPem(pemKey)));
    relayedTx.applySignature(await signer.sign(relayedTx.serializeForSigning()));
    

    return relayedTx;  // Let the wallet sign this transaction instead
  } catch (error) {
    console.error('Error creating relayed transaction:', error);
    throw error;
  }
}; 