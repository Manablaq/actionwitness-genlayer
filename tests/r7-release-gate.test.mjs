import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/r7_release_gate.mjs',import.meta.url),'utf8');
test('R7 gate has no signing, RPC mutations or POST',()=>{
  for(const word of ['writeContract(', 'eth_sendRawTransaction','sendTransaction(', "method:'POST'",'eth_requestAccounts','personal_sign','signMessage(']){
    assert.ok(!source.includes(word),'forbidden write capability '+word);
  }
  assert.match(source,/method:'GET'/);
  assert.match(source,/SUBMISSION_READY=NO/);
});
test('R7 gate tests chain, source, snapshots and both historical calls',()=>{
  for(const needle of ['/api/health','/api/snapshot','/api/tx/','contractSchemaVerified','transactionIdentityVerified','FINALIZED_EXECUTION_UNVERIFIED'])assert.ok(source.includes(needle),needle);
});
