import { CHAIN_ID, CONTRACT_ADDRESS, NETWORK } from '../../../lib/constants.mjs';
import { rpc, jsonOk, jsonErr } from '../../../lib/server-rpc.mjs';
import { assertPinnedDeployment } from '../../../lib/pinned.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    const chain = await rpc('eth_chainId', []);
    if (BigInt(chain)!==BigInt(CHAIN_ID)) throw new Error('Unexpected GenLayer chain: '+chain);
    const verified=await assertPinnedDeployment();
    return jsonOk({connected:true,chainId:CHAIN_ID,network:NETWORK,contract:CONTRACT_ADDRESS,contractSchemaVerified:true,sourceSha256:verified.sourceSha256,asOf:new Date().toISOString()});
  } catch(error) { return jsonErr(error); }
}
