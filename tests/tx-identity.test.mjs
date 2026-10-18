import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChainEnvelope } from '../lib/tx-identity.mjs';
import { CONTRACT_ADDRESS } from '../lib/constants.mjs';
const H='0x'+'f4'.repeat(32);
test('transaction hash and contract must both match',()=>{
 const v=classifyChainEnvelope(H,{hash:H,to_address:CONTRACT_ADDRESS,from_address:'0x'+'aa'.repeat(20),nonce:17});
 assert.equal(v.transactionIdentityVerified,true);assert.equal(v.contractCallVerified,true);assert.equal(v.nonce,'17');
});
test('wrong hash never treated as matched contract call',()=>{
 const v=classifyChainEnvelope(H,{hash:'0x'+'cc'.repeat(32),to_address:CONTRACT_ADDRESS});
 assert.equal(v.contractCallVerified,false);
});
test('wrong contract never treated as matched',()=>{
 const v=classifyChainEnvelope(H,{hash:H,to_address:'0x'+'bb'.repeat(20)});
 assert.equal(v.transactionIdentityVerified,true);assert.equal(v.contractCallVerified,false);
});
test('invalid and missing envelopes fail closed',()=>{
 assert.equal(classifyChainEnvelope(H,{}).contractCallVerified,false);
 assert.equal(classifyChainEnvelope(H,null).transactionIdentityVerified,false);
 assert.throws(()=>classifyChainEnvelope('not-a-hash',{}));
});
