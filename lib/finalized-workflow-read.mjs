import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { WORKFLOW_CHAIN_ID, WORKFLOW_CONTRACT_ADDRESS, WORKFLOW_SCHEMA } from './workflow-constants.mjs';

function decode(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { throw new Error('Contract returned malformed JSON.'); }
}

export async function readVerifiedFinal(functionName, args) {
  if (!WORKFLOW_CONTRACT_ADDRESS) throw new Error('Shared workflow deployment is not configured.');
  if (studioDevnet.id !== WORKFLOW_CHAIN_ID) throw new Error('Installed SDK Studio Devnet mismatch.');
  const client = createClient({ chain: studioDevnet });
  const snapshot = decode(await client.readContract({
    address: WORKFLOW_CONTRACT_ADDRESS,
    functionName: 'get_snapshot',
    args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  }));
  if (snapshot?.schema !== WORKFLOW_SCHEMA) throw new Error('Configured deployment returned an unexpected finalized schema.');
  const value = decode(await client.readContract({
    address: WORKFLOW_CONTRACT_ADDRESS,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  }));
  return { value, snapshot };
}

export function validWorkflowId(value) {
  return typeof value === 'string' && new TextEncoder().encode(value).length <= 96 && /^[A-Za-z0-9_:.\-]{1,96}$/.test(value);
}
