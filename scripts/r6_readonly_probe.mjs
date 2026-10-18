#!/usr/bin/env node
/** Read-only deployed integration probe; never calls a signing or send RPC. */
import { CONTRACT_ADDRESS, CONTRACT_SOURCE_SHA256, CHAIN_ID, HISTORIC } from '../lib/constants.mjs';
const base = process.argv[2];
if (!base || !/^https:\/\/[A-Za-z0-9.-]+\.vercel\.app\/?$/.test(base)) {
  console.error('Usage: node scripts/r6_readonly_probe.mjs https://<owned-vercel-host>.vercel.app');
  process.exit(2);
}
const allowed = new Set(['/api/health','/api/snapshot', ...HISTORIC.map(x=>'/api/tx/'+x.hash)]);
let ok=true;
for (const path of allowed) {
  try {
    const response=await fetch(new URL(path,base),{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
    const raw=await response.text();
    if (raw.length>100000 || response.status!==200) throw Error('HTTP '+response.status+' / body length '+raw.length);
    const data=JSON.parse(raw);
    let match=false;
    if(path==='/api/health')match=data.connected===true && data.chainId===CHAIN_ID && data.contract?.toLowerCase()===CONTRACT_ADDRESS.toLowerCase() && data.sourceSha256===CONTRACT_SOURCE_SHA256 && data.contractSchemaVerified===true;
    else if(path==='/api/snapshot')match=data.source==='LATEST_FINAL' && data.snapshot?.schema==='ACTIONWITNESS_GATE0_V1' && data.snapshot?.review_count===2 && data.snapshot?.last_decision==='ALLOW' && data.snapshot?.authorization_usable===false;
    else match=data.hash?.toLowerCase()===path.split('/').pop() && data.finalized===true && data.transactionIdentityVerified===true && data.contractCallVerified===true && data.executionSucceeded===false;
    if(!match)throw Error('Response assertions failed; snapshot may have changed or transaction proof insufficient.');
    console.log(path+'=PASS');
  }catch(error){ok=false;console.log(path+'=FAIL '+String(error.message).slice(0,180));}
}
console.log('NETWORK_READS_ONLY=YES');
console.log('SIGNING_PERFORMED=NO');
console.log('BLOCKCHAIN_WRITES=0');
console.log('FINAL_RC='+(ok?0:1));
process.exitCode=ok?0:1;
