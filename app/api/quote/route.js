import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../../../lib/constants.mjs';
import { validateAction, isAddress } from '../../../lib/guards.mjs';
import { quoteSimulationAccount } from '../../../lib/sdk-account.mjs';
import { requireGate0Owner } from '../../../lib/owner-gate.mjs';
import { assertPinnedDeployment } from '../../../lib/pinned.mjs';
import { jsonErr, jsonOk } from '../../../lib/server-rpc.mjs';
import { quotePermit } from '../../../lib/quote-throttle.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const encode = x => JSON.parse(JSON.stringify(x,(_k,v)=>typeof v==='bigint'?v.toString():v));
export async function POST(request) {
  try {
    const origin=request.headers.get('origin');
    if(origin && new URL(origin).origin !== new URL(request.url).origin) return jsonErr(new Error('Cross-origin simulation requests are not allowed.'),403);
    if(!quotePermit())return jsonErr(new Error('Simulation request limit reached. Retry later.'),429);
    const size=Number(request.headers.get('content-length')||0);
    if (size>3000) return jsonErr(new Error('Request too large.'),413);
    const bodyText=await request.text();
    if(bodyText.length>3000) return jsonErr(new Error('Request too large.'),413);
    const body=JSON.parse(bodyText);
    if (!isAddress(body?.account))return jsonErr(new Error('Connect a valid wallet account for a signer-bound quote.'),400);
    try { requireGate0Owner(body.account); } catch (error) { return jsonErr(error,403); }
    const error=validateAction(body?.action);
    if (error) return jsonErr(new Error(error),400);
    if(studioDevnet.id!==CHAIN_ID) throw new Error('SDK chain mismatch.');
    await assertPinnedDeployment();
    const call={account:body.account,address:CONTRACT_ADDRESS,functionName:'review_sample',args:[body.action.trim()]};
    const client=createClient({chain:studioDevnet});
    const quote=await client.estimateTransactionFeesForWrite({...call,account:quoteSimulationAccount(body.account)});
    if(!quote || BigInt(quote.feeValue ?? '-1')<=0n || !quote.distribution) throw new Error('Network did not provide a usable fee quote.');
    return jsonOk({account:body.account,quote:encode({feeValue:quote.feeValue,distribution:quote.distribution}),call:{address:CONTRACT_ADDRESS,functionName:'review_sample',args:[body.action.trim()]},network:'Studio Devnet',asOf:new Date().toISOString(),validForSeconds:60,authorized:false});
  } catch (error) { return jsonErr(error); }
}
