import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../scripts/r6_readonly_probe.mjs',import.meta.url),'utf8');
test('R6 verifier allowlists reads and does not sign or send transactions',()=>{
 assert.match(src,/const allowed = new Set/);
 assert.match(src,/SIGNING_PERFORMED=NO/);
 assert.match(src,/BLOCKCHAIN_WRITES=0/);
 assert.doesNotMatch(src,/sendRawTransaction|writeContract|signTransaction|privateKey/);
});
