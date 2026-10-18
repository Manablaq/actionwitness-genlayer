import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPinnedDeployment } from '../lib/pinned.mjs';
test('wrong live source is refused even with expected address',async()=>{
 const prev=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:Buffer.from('malicious source').toString('base64')}),{status:200})};
 try{await assert.rejects(assertPinnedDeployment,/no longer matches/);assert.equal(calls,1)}finally{globalThis.fetch=prev}
});
test('unsafe deployed code encoding is rejected',async()=>{
 const prev=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:'not-base64:!!'}),{status:200});
 try{await assert.rejects(assertPinnedDeployment,/encoding is invalid/)}finally{globalThis.fetch=prev}
});
