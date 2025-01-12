import { 
  Address,
  SmartContract,
  AbiRegistry,
  ContractFunction,
  ResultsParser,
  TypedValue
} from '@multiversx/sdk-core';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { mvxConfig } from '../config/config';
import { contractConfig } from '../config/contract';

let networkProvider: ProxyNetworkProvider | null = null;

export const getContract = (address: string, abi: any) => {
  const abiRegistry = AbiRegistry.create(abi);
  return new SmartContract({
    address: new Address(address),
    abi: abiRegistry
  });
};

export const getNetworkProvider = () => {
  if (!networkProvider) {
    networkProvider = new ProxyNetworkProvider(mvxConfig.apiUrl, {
      timeout: 10000,
    });
  }
  return networkProvider;
};

export const queryContract = async (
  functionName: string,
  args: TypedValue[] = [],
  returnTypes: any[],
  customAbi?: any,
  customAddress?: string
) => {
  try {
    const contract = customAbi 
      ? getContract(customAddress || contractConfig.address, customAbi)
      : getContract(contractConfig.address, contractConfig.abi);
    
    const proxy = getNetworkProvider();

    const query = contract.createQuery({
      func: new ContractFunction(functionName),
      args
    });

    const queryResponse = await proxy.queryContract(query);
    
    if (!queryResponse || !queryResponse.returnData) {
      throw new Error('No response received from the contract');
    }

    return queryResponse;
  } catch (error: any) {
    throw new Error(
      `Failed to query contract endpoint '${functionName}': ${error.message || 'Unknown error'}`
    );
  }
};