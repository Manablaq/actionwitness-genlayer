#!/usr/bin/env node
/** Read-only release gate. Only HTTP GET, no JSON-RPC POST, no wallets or signing. */
import { CHAIN_ID, CONTRACT_ADDRESS, CONTRACT_SOURCE_SHA256, HISTORIC } from '../lib/constants.mjs';
import { isHash } from '../lib/guards.mjs';
const base = process.argv[2];
if (!base || !/^https:\/\/[a-z0-9-]+\.vercel\.app\/?$/i.test(base)) {
  console.error('USAGE: node scripts/r7_release_gate.mjs https://DEPLOYMENT.vercel.app');
  process.exit(2);
}
const url = new URL(base);
const checks=[];
async function get(path){
  const target=new URL(path,url);
  if (target.origin !== url.origin) throw Error('Cross-origin request refused');
  const resp=await fetch(target,{method:'GET',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(18000)});
  if (resp.status!==200)throw Error('HTTP '+resp.status);
  const body=await resp.text();
  if (body.length>100000)throw Error('Oversized API response');
  return JSON.parse(body);
}
async function check(label,path,verify){
 try{const v=await get(path); if(!verify(v)) throw Error('Invalid or contradictory result'); checks.push([label,'PASS']);}
 catch(e){checks.push([label,'FAIL: '+String(e.message).slice(0,180)]);}
}
await check('CHAIN_AND_SOURCE','/api/health',x=>x.connected===true&&x.chainId===CHAIN_ID&&x.contract?.toLowerCase()===CONTRACT_ADDRESS.toLowerCase()&&x.contractSchemaVerified===true&&x.sourceSha256===CONTRACT_SOURCE_SHA256);
await check('LATEST_SHARED_SNAPSHOT','/api/snapshot',x=>x.source==='LATEST_FINAL'&&x.snapshot?.schema==='ACTIONWITNESS_GATE0_V1'&&x.snapshot?.authorization_usable===false&&Number.isSafeInteger(x.snapshot?.review_count));
for(const h of HISTORIC){
 if(!isHash(h.hash))throw Error('Invalid historical reference in source');
 await check('TX_'+h.decision,'/api/tx/'+h.hash,x=>x.finalized===true&&x.hash?.toLowerCase()===h.hash.toLowerCase()&&x.transactionIdentityVerified===true&&x.contractCallVerified===true&&x.executionSucceeded===false&&x.outcome==='FINALIZED_EXECUTION_UNVERIFIED');
}
const ok=checks.every(([,s])=>s==='PASS');
for(const [name,status] of checks)console.log(`${name}=${status}`);
console.log('WALLET_E2E_TEST=NOT_PERFORMED');
console.log('LIVE_FEE_QUOTE=NOT_TESTED_BY_GET_ONLY_GATE');
console.log('GENVM_EXECUTION=UNVERIFIED');
console.log('PUBLIC_ACCESS=NOT_VERIFIED_BY_AUTHENTICATED_GATE');
console.log('NETWORK_READS_ONLY=YES');
console.log('SIGNING_PERFORMED=NO');
console.log('BLOCKCHAIN_WRITES=0');
console.log('SUBMISSION_READY=NO');
console.log('FINAL_RC='+(ok?0:1));
process.exitCode=ok?0:1;
