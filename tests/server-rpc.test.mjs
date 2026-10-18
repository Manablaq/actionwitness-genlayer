import test from 'node:test';
import assert from 'node:assert/strict';
import { rpc } from '../lib/server-rpc.mjs';

test('RPC denies arbitrary methods and broadcasts before any network access', async()=>{
  const old=globalThis.fetch; let calls=0;globalThis.fetch=async()=>{calls++;throw Error('must not call');};
  try{
    for(const name of ['eth_sendRawTransaction','eth_sendTransaction','personal_sign','gen_call']){
      await assert.rejects(()=>rpc(name,[]),/not permitted/);
    }
    assert.equal(calls,0);
  }finally{globalThis.fetch=old}
});
test('RPC refuses HTTP403 and never retries', async()=>{
  const old=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('blocked',{status:403})};
  try{await assert.rejects(()=>rpc('eth_chainId',[]),/HTTP 403/);assert.equal(calls,1)}finally{globalThis.fetch=old}
});
test('RPC accepts one well-formed chain read',async()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async(_url,opts)=>{calls++;assert.equal(opts.method,'POST');assert.equal(opts.redirect,'error');const body=JSON.parse(opts.body);assert.equal(body.method,'eth_chainId');return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:'0xf22d'}),{status:200})};
 try{assert.equal(await rpc('eth_chainId',[]),'0xf22d');assert.equal(calls,1)}finally{globalThis.fetch=old}
});
test('RPC rejects returned errors and mismatched IDs',async()=>{
 const old=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,error:{message:'unavailable'}}),{status:200});
  await assert.rejects(()=>rpc('eth_chainId',[]),/unavailable/);
  globalThis.fetch=async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:999,result:'0xf22d'}),{status:200});
  await assert.rejects(()=>rpc('eth_chainId',[]),/Malformed/);
 }finally{globalThis.fetch=old}
});
