import { createHash } from 'node:crypto';
import { CONTRACT_ADDRESS, CONTRACT_SOURCE_SHA256 } from './constants.mjs';
import { rpc } from './server-rpc.mjs';

export async function assertPinnedDeployment() {
  const code=await rpc('gen_getContractCode',[CONTRACT_ADDRESS]);
  if(typeof code!=='string'||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(code)) throw new Error('Deployed contract code encoding is invalid.');
  const bytes=Buffer.from(code,'base64');
  if(bytes.length<1 || bytes.length>100000 || bytes.toString('base64')!==code) throw new Error('Deployed contract encoding is not canonical.');
  const digest=createHash('sha256').update(bytes).digest('hex');
  if(digest!==CONTRACT_SOURCE_SHA256) throw new Error('Deployed contract source no longer matches the verified Gate 0 source.');
  const schema=await rpc('gen_getContractSchema',[CONTRACT_ADDRESS]);
  const methods=Array.isArray(schema?.methods)?schema.methods.map(x=>typeof x==='string'?x:x.name):Object.keys(schema?.methods||{});
  if(!['get_snapshot','review_sample','record_probe'].every(x=>methods.includes(x))) throw new Error('Deployed contract interface changed.');
  return {sourceSha256:digest,methods};
}
