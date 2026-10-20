import { WORKFLOW_CHAIN_ID, WORKFLOW_CONTRACT_ADDRESS, WORKFLOW_NETWORK } from '../../../lib/workflow-constants.mjs';
import { WORKFLOW_SCHEMA } from '../../../lib/workflow-constants.mjs';
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { rpc, jsonOk, jsonErr } from '../../../lib/server-rpc.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    const chain = await rpc('eth_chainId', []);
    if (BigInt(chain)!==BigInt(WORKFLOW_CHAIN_ID)) throw new Error('Unexpected GenLayer chain: '+chain);
    let contractSchemaVerified = false;
    let snapshot = null;
    if (WORKFLOW_CONTRACT_ADDRESS) {
      if (studioDevnet.id !== WORKFLOW_CHAIN_ID) throw new Error('Installed SDK Studio Devnet mismatch.');
      const client = createClient({chain: studioDevnet});
      const raw = await client.readContract({
        address: WORKFLOW_CONTRACT_ADDRESS,
        functionName: 'get_snapshot',
        args: [],
        transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
      });
      snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
      contractSchemaVerified = snapshot?.schema === WORKFLOW_SCHEMA;
    }
    return jsonOk({
      connected: true,
      configured: Boolean(WORKFLOW_CONTRACT_ADDRESS),
      chainId: WORKFLOW_CHAIN_ID,
      network: WORKFLOW_NETWORK,
      contract: WORKFLOW_CONTRACT_ADDRESS || null,
      contractSchemaVerified,
      snapshot,
      note: contractSchemaVerified ? 'Configured deployment matches the published shared-workflow schema; verify fresh workflow state before submission.' : WORKFLOW_CONTRACT_ADDRESS ? 'Configured deployment did not return the published shared-workflow schema.' : 'Fresh workflow deployment is not configured.',
      asOf: new Date().toISOString(),
    });
  } catch(error) { return jsonErr(error); }
}
