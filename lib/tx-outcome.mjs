import { CONTRACT_ADDRESS } from './constants.mjs';
import { isHash, isAddress, describeStatus } from './guards.mjs';

function same(a,b) { return typeof a==='string' && typeof b==='string' && a.toLowerCase()===b.toLowerCase(); }
function intCode(v) {
  if(typeof v==='number' && Number.isSafeInteger(v) && v>=0) return v;
  if(typeof v==='string' && /^(0|[1-9][0-9]*)$/.test(v)) return Number(v);
  return null;
}
function executionCode(tx) {
  if(!tx || typeof tx!=='object') return null;
  const code=intCode(tx.txExecutionResult);
  if(code!==null) return code;
  const name=String(tx.txExecutionResultName??'').toUpperCase().replace(/[^A-Z]/g,'');
  const named={NOTVOTED:0,FINISHEDWITHRETURN:1,FINISHEDWITHERROR:2,TIMEOUT:3,NONDETDISAGREE:4,DETERMINISTICVIOLATION:5};
  return Object.hasOwn(named,name)?named[name]:null;
}
/** Strictly separate consensus finality, GenVM execution outcome, and EVM transport receipt. */
export function classifyTransaction(hash, statusDetails, consensusReceipt, evmReceipt, contract=CONTRACT_ADDRESS) {
  if(!isHash(hash)) throw new Error('Invalid requested transaction identifier.');
  const status=describeStatus(statusDetails?.status ?? statusDetails?.current_status ?? 'UNKNOWN');
  const finalized=status==='FINALIZED';
  const receipt=consensusReceipt && typeof consensusReceipt==='object' ? consensusReceipt : null;
  const receiptId=receipt?.id ?? receipt?.hash ?? receipt?.txId;
  const receiptRecipient=receipt?.recipient;
  const receiptStatus=intCode(receipt?.status);
  const receiptStatusName=describeStatus(receipt?.statusName);
  // Never attribute a GenVM outcome to this exact transaction or contract without matching both.
  const receiptIdentityVerified=!!receipt && same(receiptId,hash) && isAddress(receiptRecipient) && same(receiptRecipient,contract);
  const receiptFinalized=receiptStatus===7 || receiptStatusName==='FINALIZED';
  const execution=executionCode(receipt);
  const executionResult=execution===1?'FINISHED_WITH_RETURN':execution===2?'FINISHED_WITH_ERROR':execution===3?'TIMEOUT':execution===4?'NONDET_DISAGREE':execution===5?'DETERMINISTIC_VIOLATION':execution===0?'NOT_VOTED':'UNKNOWN';
  const executionSucceeded=finalized && receiptIdentityVerified && receiptFinalized && execution===1;
  const executionFailed=finalized && receiptIdentityVerified && receiptFinalized && execution!==null && execution!==1;
  const evmReceiptHash=evmReceipt?.transactionHash;
  const evmReceiptVerified=!!evmReceipt && same(evmReceiptHash,hash);
  const evmReceiptSuccess=evmReceiptVerified && (evmReceipt.status==='0x1'||evmReceipt.status===1);
  const outcome=executionSucceeded?'SUCCESS':executionFailed?'EXECUTION_FAILED':finalized?'FINALIZED_EXECUTION_UNVERIFIED':status==='CANCELED'?'CANCELED':status==='UNDETERMINED'?'UNDETERMINED':'NOT_FINALIZED';
  return {
    hash, status, finalized, outcome, executionResult, executionSucceeded, receiptIdentityVerified,
    evmReceiptVerified, evmReceiptSuccess, asOf:new Date().toISOString(),
    note: executionSucceeded
      ? 'This transaction finalized with a successful GenVM return. This does not independently prove an ALLOW or DENY policy label.'
      : executionFailed
      ? 'Consensus finalized but GenVM execution did not return successfully. Do not treat it as a completed review.'
      : finalized
      ? 'Consensus is finalized, but a matching successful GenVM execution receipt has not been verified.'
      : 'The transaction has not been proven finalized. Never retry an uncertain submission based only on this screen.'
  };
}
