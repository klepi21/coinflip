import { 
  Address,
  SmartContract,
  AbiRegistry,
  ContractFunction,
  ResultsParser,
  TypedValue
} from '@multiversx/sdk-core';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import scratchAbi from '@/config/scratch-game.abi.json';

let networkProvider: ProxyNetworkProvider | null = null;

export const getContract = (address: string) => {
  const abiRegistry = AbiRegistry.create(scratchAbi);
  return new SmartContract({
    address: new Address(address),
    abi: abiRegistry
  });
};

export const getNetworkProvider = () => {
  if (!networkProvider) {
    networkProvider = new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
      timeout: 10000,
    });
  }
  return networkProvider;
};

export const queryContract = async (
  functionName: string,
  args: TypedValue[] = [],
  contractAddress: string
) => {
  try {
    const contract = getContract(contractAddress);
    const proxy = getNetworkProvider();

    const query = contract.createQuery({
      func: new ContractFunction(functionName),
      args
    });

    const queryResponse = await proxy.queryContract(query);
    const endpointDefinition = contract.getEndpoint(functionName);
    
    if (!queryResponse || !queryResponse.returnData) {
      throw new Error('No response received from the contract');
    }

    const resultParser = new ResultsParser();
    const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);

    return results;
  } catch (error: any) {
    console.error(`Failed to query contract endpoint '${functionName}':`, error);
    throw error;
  }
};