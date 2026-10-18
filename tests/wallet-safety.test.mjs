import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureStudioDevnet,verifyWalletAccount} from '../lib/wallet-safety.mjs';
import {CHAIN_HEX,VERIFIED_OWNER} from '../lib/constants.mjs';
test('wallet already on correct chain requires no switching',async()=>{
 let calls=[];let p={request:async x=>{calls.push(x.method);return CHAIN_HEX}};
 assert.equal(await ensureStudioDevnet(p),true);assert.deepEqual(calls,['eth_chainId']);
});
test('wrong chain switches then rereads',async()=>{
 let chain='0x1';const calls=[];
 const p={request:async x=>{calls.push(x.method);if(x.method==='eth_chainId')return chain;if(x.method==='wallet_switchEthereumChain'){chain=CHAIN_HEX;return null}}};
 await ensureStudioDevnet(p);assert.deepEqual(calls,['eth_chainId','wallet_switchEthereumChain','eth_chainId']);
});
test('wallet refusal cannot fall through to signing',async()=>{
 let calls=[];const p={request:async x=>{calls.push(x.method);if(x.method==='eth_chainId')return '0x1';throw {code:4001,message:'Rejected'}}};
 await assert.rejects(ensureStudioDevnet(p),e=>e.code===4001);assert.deepEqual(calls,['eth_chainId','wallet_switchEthereumChain']);
});
test('add-network route checks chain after switch',async()=>{
 let chain='0x1';const calls=[];let once=true;
 const p={request:async x=>{calls.push(x.method);if(x.method==='eth_chainId')return chain;if(x.method==='wallet_switchEthereumChain' && once){once=false;throw {code:4902}}if(x.method==='wallet_switchEthereumChain'){chain=CHAIN_HEX;return null}return null}};
 await ensureStudioDevnet(p);assert.deepEqual(calls,['eth_chainId','wallet_switchEthereumChain','wallet_addEthereumChain','wallet_switchEthereumChain','eth_chainId']);
});
test('wallet silently failing to switch is rejected',async()=>{
 const p={request:async x=>x.method==='eth_chainId'?'0x1':null};await assert.rejects(ensureStudioDevnet(p),/mismatch/);
});
test('expected signer verified case-insensitively',async()=>{
 const p={request:async()=>[VERIFIED_OWNER.toLowerCase()]};assert.equal(await verifyWalletAccount(p,VERIFIED_OWNER),true);
});
test('account change is refused',async()=>{
 const p={request:async()=>['0x0000000000000000000000000000000000000001']};await assert.rejects(verifyWalletAccount(p,VERIFIED_OWNER),/changed/);
});
