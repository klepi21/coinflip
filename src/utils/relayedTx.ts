import { Account, Address, Transaction, TransactionPayload, RelayedTransactionV2Builder } from "@multiversx/sdk-core";
import { parseUserKey, UserSigner } from "@multiversx/sdk-wallet";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { signTransactions } from "@multiversx/sdk-dapp/services/transactions";

const RELAYER_ADDRESS = process.env.NEXT_PUBLIC_RELAYER_ADDRESS!;
const RELAYER_PEM = process.env.NEXT_PUBLIC_RELAYER_PEM!;
const networkProvider = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com');

export const createInnerTx = async (
  userAddress: string,
  tokenId: string,
  amount: number,
  scAddress: string
) => {
  try {
    // Get user account
    const userAccount = new Account(new Address(userAddress));
    const userOnNetwork = await networkProvider.getAccount(new Address(userAddress));
    userAccount.update(userOnNetwork);

    // Create inner transaction
    const data = `ESDTTransfer@${Buffer.from(tokenId).toString('hex')}@${amount.toString(16).padStart(16, '0')}@${Buffer.from('testBuy').toString('hex')}@${new Address(userAddress).hex()}`;
    
    const innerTx = new Transaction({
      sender: new Address(userAddress),
      receiver: new Address(RELAYER_ADDRESS),
      value: 0,
      gasLimit: 0,
      nonce: userAccount.nonce,
      data: new TransactionPayload(data),
      chainID: 'D',
      version: 2
    });

    // Let user sign the transaction
    const { sessionId } = await signTransactions({
      transactions: [innerTx],
      transactionsDisplayInfo: {
        processingMessage: 'Processing inner transaction',
        errorMessage: 'An error occurred during inner transaction',
        successMessage: 'Inner transaction successful'
      }
    });

    return { sessionId, innerTx };
  } catch (error) {
    console.error('Error creating inner transaction:', error);
    throw error;
  }
};

export const createRelayedTx = async (innerTx: Transaction) => {
  try {
    // Get relayer account
    const relayerAddress = new Address(RELAYER_ADDRESS);
    const relayerAccount = new Account(relayerAddress);
    const relayerOnNetwork = await networkProvider.getAccount(relayerAddress);
    relayerAccount.update(relayerOnNetwork);

    // Build relayed transaction
    const relayedTx = new RelayedTransactionV2Builder()
      .setInnerTransaction(innerTx)
      .setInnerTransactionGasLimit(20000000)
      .setRelayerAddress(relayerAddress)
      .setRelayerNonce(relayerAccount.nonce)
      .setNetworkConfig({
        MinGasLimit: 50000,
        GasPerDataByte: 1500,
        GasPriceModifier: 0.01,
        ChainID: 'D'
      })
      .build();

    // Sign with relayer
    const pemKey = RELAYER_PEM.replace(/\\n/g, '\n');
    const signer = new UserSigner(parseUserKey(pemKey));
    const signature = await signer.sign(relayedTx.serializeForSigning());
    relayedTx.applySignature(signature);

    // Send transaction
    const result = await networkProvider.sendTransaction(relayedTx);
    return result;
  } catch (error) {
    console.error('Error creating relayed transaction:', error);
    throw error;
  }
}; 