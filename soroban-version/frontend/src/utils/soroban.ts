import { 
  rpc,
} from '@stellar/stellar-sdk';
import { SOROBAN_RPC_URL } from '../constants';

const server = new rpc.Server(SOROBAN_RPC_URL);

export const invokeContract = async (
  contractId: string, 
  method: string, 
  _args: any[],
  address: string
) => {
  // Skeleton for Soroban contract invocation
  console.log(`Invoking ${method} on ${contractId} for ${address}`);
  return { status: 'PENDING', hash: '...' };
};

export const pollTxStatus = async (hash: string) => {
  let status = 'PENDING';
  while (status === 'PENDING') {
    const res = await server.getTransaction(hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { success: true, result: res.resultMetaXdr };
    }
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Transaction failed on-chain");
    }
    await new Promise(r => setTimeout(r, 2000));
  }
};
