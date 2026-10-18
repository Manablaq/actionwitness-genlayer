import test from 'node:test';
import assert from 'node:assert/strict';
import { requireQuoteAccount } from '../lib/quote-binding.mjs';
const ACCOUNT='0x7A4a1f1acDa02E984ca80A86F08fb50dd03AC585';
test('quoted account matches regardless of EVM address checksum casing',()=>assert.equal(requireQuoteAccount({account:ACCOUNT.toLowerCase()},ACCOUNT),true));
test('mismatched quoted account cannot sign',()=>assert.throws(()=>requireQuoteAccount({account:'0x0000000000000000000000000000000000000001'},ACCOUNT),/different/));
test('missing or malformed account fails closed',()=>{for(const q of [{},null,{account:'abc'}])assert.throws(()=>requireQuoteAccount(q,ACCOUNT));});
test('invalid expected account fails closed',()=>assert.throws(()=>requireQuoteAccount({account:ACCOUNT},'not-an-address')));
