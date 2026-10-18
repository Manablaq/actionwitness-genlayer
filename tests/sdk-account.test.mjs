import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quoteSimulationAccount} from '../lib/sdk-account.mjs';
const ACCOUNT='0x7A4a1f1acDa02E984ca80A86F08fb50dd03AC585';
test('fee simulation uses an SDK object with address rather than a plain string', () => {
  const signer=quoteSimulationAccount(ACCOUNT);
  assert.deepEqual(signer,{address:ACCOUNT});
  assert.equal(signer.address,ACCOUNT);
});
test('invalid or zero-address signer is refused before any simulation', () => {
  for(const v of [undefined,null,'', '0x0', '0x'+'0'.repeat(40),'0x'+'z'.repeat(40)]) {
    assert.throws(()=>quoteSimulationAccount(v),/wallet address/);
  }
});
test('live quote route passes structured account into fee estimation',()=>{
  const route=readFileSync(new URL('../app/api/quote/route.js',import.meta.url),'utf8');
  assert.match(route,/estimateTransactionFeesForWrite\(\{\.\.\.call,account:quoteSimulationAccount\(body\.account\)\}\)/);
  assert.doesNotMatch(route,/estimateTransactionFeesForWrite\(call\)/);
});
