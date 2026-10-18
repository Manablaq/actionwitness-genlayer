import { RPC_URL } from './constants.mjs';
const METHODS = new Set(['eth_chainId','gen_getTransactionStatusDetails','eth_getTransactionReceipt','gen_getContractSchema','gen_getContractCode','gen_getTransactionReceipt','eth_getTransactionByHash']);
export async function rpc(method, params = []) {
  if (!METHODS.has(method)) throw new Error('RPC method not permitted');
  const id = 1;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(RPC_URL, {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0', id, method, params}),
      redirect:'error', cache:'no-store', signal:controller.signal
    });
    if (!response.ok) throw new Error(response.status===403?'Studio Devnet RPC blocked this request (HTTP 403).':'Studio Devnet returned HTTP '+response.status);
    const raw = await response.text();
    if (raw.length>400000) throw new Error('RPC response too large.');
    const result = JSON.parse(raw);
    if (result?.id!==id || result?.jsonrpc!=='2.0') throw new Error('Malformed RPC envelope.');
    if (result.error) throw new Error(typeof result.error.message==='string'?result.error.message:'RPC returned an error.');
    if (!Object.prototype.hasOwnProperty.call(result,'result')) throw new Error('RPC result missing.');
    return result.result;
  } finally { clearTimeout(timeout); }
}
export const jsonHeaders = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
export function jsonOk(result) { return Response.json(result,{headers:jsonHeaders}); }
export function jsonErr(error, status=502) { return Response.json({error:String(error?.message||error).slice(0,240)}, {status,headers:jsonHeaders}); }
