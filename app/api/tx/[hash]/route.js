import { isHash } from '../../../../lib/guards.mjs';
import { classifyTransaction } from '../../../../lib/tx-outcome.mjs';
import { classifyChainEnvelope } from '../../../../lib/tx-identity.mjs';
import { rpc, jsonOk, jsonErr } from '../../../../lib/server-rpc.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(_request, {params}) {
  const {hash}=await params;
  if(!isHash(hash))return jsonErr(new Error('Enter a valid 0x transaction hash.'),400);
  try {
    const details=await rpc('gen_getTransactionStatusDetails',[hash]);
    const raw=String(details?.status ?? details?.current_status ?? 'UNKNOWN');
    let consensusReceipt=null,evmReceipt=null,chainTx=null,consensusReceiptError=null,chainTxError=null;
    if(['FINALIZED','ACCEPTED'].includes(raw.toUpperCase())) {
      // The documented receipt RPC is not currently implemented by the observed Studio Devnet endpoint.
      // Never infer GenVM execution success from an EVM receipt or the historical snapshot.
      try { consensusReceipt=await rpc('gen_getTransactionReceipt',[{txId:hash}]); }
      catch(error) { consensusReceiptError=String(error?.message||error).slice(0,120); }
      // Studio Devnet exposes the version-specific transaction envelope RPC used in the verified R13 journal.
      try { chainTx=await rpc('eth_getTransactionByHash',[hash]); }
      catch(error) {chainTxError=String(error?.message||error).slice(0,120);}
      try { evmReceipt=await rpc('eth_getTransactionReceipt',[hash]); }
      catch { /* Supplemental Ethereum transport receipt only. */ }
    }
    const result=classifyTransaction(hash,details,consensusReceipt,evmReceipt);
    const identity=classifyChainEnvelope(hash,chainTx);
    return jsonOk({...result,...identity,rawStatus:raw,
      consensusReceiptAvailable:!!consensusReceipt,
      consensusReceiptError,chainTxError,
      note:result.executionSucceeded?result.note:
      result.note+' A verified transaction envelope does not substitute for a GenVM receipt.'});
  } catch(error) {return jsonErr(error);}
}
