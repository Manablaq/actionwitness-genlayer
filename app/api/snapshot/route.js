import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { WORKFLOW_CHAIN_ID, WORKFLOW_CONTRACT_ADDRESS, WORKFLOW_SCHEMA } from '../../../lib/workflow-constants.mjs';
import { jsonOk, jsonErr } from '../../../lib/server-rpc.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    if (!WORKFLOW_CONTRACT_ADDRESS) throw new Error('Fresh workflow deployment is not configured.');
    if (studioDevnet.id!==WORKFLOW_CHAIN_ID) throw new Error('Installed SDK Studio Devnet mismatch.');
    const client=createClient({chain:studioDevnet});
    const value=await client.readContract({address:WORKFLOW_CONTRACT_ADDRESS,functionName:'get_snapshot',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
    const snapshot=typeof value==='string' ? JSON.parse(value) : value;
    if (snapshot?.schema !== WORKFLOW_SCHEMA) throw new Error('Configured deployment returned an unexpected workflow schema.');
    return jsonOk({snapshot,source:'LATEST_FINAL',schemaVerified:true,contract:WORKFLOW_CONTRACT_ADDRESS,asOf:new Date().toISOString()});
  } catch (error) { return jsonErr(error); }
}
