import { CONTRACT_ADDRESS } from './constants.mjs';
import { isHash, isAddress } from './guards.mjs';
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
// A chain transaction envelope is useful for linkage, but does not establish a successful GenVM execution.
export function classifyChainEnvelope(hash, tx, contract=CONTRACT_ADDRESS) {
  if(!isHash(hash))throw Error('Invalid transaction hash.');
  if(!tx || typeof tx!=='object')return {transactionIdentityVerified:false,contractCallVerified:false,nonce:null};
  const id=tx.hash??tx.transaction_hash??tx.id;
  const recipient=tx.to_address??tx.to??tx.recipient;
  const sender=tx.from_address??tx.from??tx.txOrigin??tx.sender;
  const transactionIdentityVerified=same(id,hash);
  const contractCallVerified=transactionIdentityVerified && isAddress(recipient) && same(recipient,contract);
  const nonce=(typeof tx.nonce==='number' && Number.isSafeInteger(tx.nonce) && tx.nonce>=0) ? String(tx.nonce)
     : (typeof tx.nonce==='string' && /^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(tx.nonce)) ? String(BigInt(tx.nonce)) : null;
  return {transactionIdentityVerified,contractCallVerified,nonce,from:transactionIdentityVerified && isAddress(sender)?sender:null};
}
