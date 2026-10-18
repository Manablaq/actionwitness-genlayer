import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { CHAIN_ID, CONTRACT_ADDRESS } from '../../../lib/constants.mjs';
import { normalizeSnapshot } from '../../../lib/guards.mjs';
import { assertPinnedDeployment } from '../../../lib/pinned.mjs';
import { jsonOk, jsonErr } from '../../../lib/server-rpc.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    if (studioDevnet.id!==CHAIN_ID) throw new Error('Installed SDK Studio Devnet mismatch.');
    await assertPinnedDeployment();
    const client=createClient({chain:studioDevnet});
    const value=await client.readContract({address:CONTRACT_ADDRESS,functionName:'get_snapshot',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
    return jsonOk({snapshot:normalizeSnapshot(value),source:'LATEST_FINAL',asOf:new Date().toISOString()});
  } catch (error) { return jsonErr(error); }
}
