import {
  CALL_KEY_UNNAMED,
  createAccount,
  createClient,
  encodeExternalMessageFeeParams,
  MessageType,
} from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { ExecutionResult, TransactionHashVariant } from 'genlayer-js/types';

const CONTRACT = process.env.ACTIONWITNESS_LIVE_CONTRACT_ADDRESS || '0x0B5B0Dc6Af8556F0686e2dd3FF2106ab642C8023';
const NETWORK = 'GenLayer Studio Devnet';
const CHAIN_ID = 61997;
const CONFIRMATION = 'I_UNDERSTAND';
const WORKFLOW_ID = 'delivery-001';
const POLICY_ID = 'delivery-v1';
const POLICY_JSON = JSON.stringify({
  name: 'Action delivery policy',
  criteria: [
    { id: 1, text: 'The action artifact identifies the requested deliverable and its intended recipient.' },
    { id: 2, text: 'The evidence artifact demonstrates completion without exposing credentials or private keys.' },
  ],
});
const POLICY_SHA256 = '2a468b13e7880df01ac8c901fb19260ae9ca2564c96e3f1d2a758d2927e51a0b';
const ACTION_URI = 'https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/2ae086ea2ee2e32bdf72e808297ae7b2281939bb/public/evidence/action-delivery-v1.json';
const ACTION_SHA256 = 'c32eb9f496919b7aca2eba2b178e16ca3651788d6332c8065cba2c115334a77f';
const EVIDENCE_URI = 'https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/2ae086ea2ee2e32bdf72e808297ae7b2281939bb/public/evidence/evidence-delivery-v1.json';
const EVIDENCE_SHA256 = '55c5d7099fa5db9226ba3e6eb0d949c65f884b7284640dcbb1e97e63794791cd';
const ESCROW = 1_000_000_000_000_000n;
// Studio Devnet sim_getFeeConfig reports a 500k default external gas limit
// and 300m max gas price. Keep the transfer allocation explicit so the
// finalized child-message payout is funded by the parent claim transaction.
const PAYOUT_EXTERNAL_GAS_LIMIT = 500_000n;
const PAYOUT_EXTERNAL_MAX_GAS_PRICE = 300_000_000n;

function fail(message) {
  console.error(`Live evidence stopped: ${message}`);
  process.exitCode = 1;
}

function requireKey(name) {
  const value = process.env[name] || '';
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${name} must be supplied as a 0x-prefixed 32-byte key; it is never printed or stored.`);
  }
  return value;
}

function json(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2);
}

function clientFor(account) {
  return createClient({ chain: studioDevnet, account });
}

async function readFinal(functionName, args) {
  const client = createClient({ chain: studioDevnet });
  const chainId = await client.request({ method: 'eth_chainId', params: [] });
  if (Number.parseInt(chainId, 16) !== CHAIN_ID) throw new Error(`RPC returned ${chainId}, expected chain ${CHAIN_ID}`);
  return client.readContract({
    address: CONTRACT,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

async function waitFinal(client, txHash) {
  const receipt = await client.waitForFinalization({
    hash: txHash,
    interval: 15_000,
    retries: 240,
    fullTransaction: false,
  });
  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(`Finalized transaction ${txHash} execution result was ${receipt.txExecutionResultName || 'unknown'}.`);
  }
  return receipt;
}

async function writeFinal(label, account, functionName, args, value = 0n, feeOptions = {}) {
  const client = clientFor(account);
  const call = { account, address: CONTRACT, functionName, args, ...(value ? { value } : {}) };
  const quote = await client.estimateTransactionFeesForWrite({ ...call, ...feeOptions });
  if (!quote?.distribution || BigInt(quote.feeValue || 0) <= 0n) throw new Error(`${label}: network returned no usable fee quote.`);
  const txHash = await client.writeContract({
    ...call,
    fees: {
      distribution: quote.distribution,
      messageAllocations: quote.messageAllocations,
      feeValue: BigInt(quote.feeValue),
    },
  });
  console.log(JSON.stringify({ event: 'submitted', label, functionName, txHash, actor: account.address }));
  const receipt = await waitFinal(client, txHash);
  console.log(JSON.stringify({ event: 'finalized', label, txHash, status: receipt.statusName, execution: receipt.txExecutionResultName }));
  return txHash;
}

try {
  if (process.env.ACTIONWITNESS_LIVE_CONFIRM !== CONFIRMATION) {
    throw new Error(`Set ACTIONWITNESS_LIVE_CONFIRM=${CONFIRMATION} to authorize the on-chain run.`);
  }
  if (studioDevnet.id !== CHAIN_ID) throw new Error(`Installed SDK chain is ${studioDevnet.id}, expected ${CHAIN_ID}.`);

  const requester = createAccount(requireKey('ACTIONWITNESS_REQUESTER_PRIVATE_KEY'));
  const beneficiary = createAccount(requireKey('ACTIONWITNESS_BENEFICIARY_PRIVATE_KEY'));
  const reviewer = process.env.ACTIONWITNESS_REVIEWER_PRIVATE_KEY
    ? createAccount(requireKey('ACTIONWITNESS_REVIEWER_PRIVATE_KEY'))
    : requester;
  const addresses = [requester.address, beneficiary.address, reviewer.address].map(value => value.toLowerCase());
  if (addresses[0] === addresses[1]) throw new Error('Requester and beneficiary must be different wallets.');

  console.log(JSON.stringify({
    event: 'preflight',
    network: NETWORK,
    chainId: CHAIN_ID,
    contract: CONTRACT,
    workflowId: WORKFLOW_ID,
    requester: requester.address,
    beneficiary: beneficiary.address,
    reviewer: reviewer.address,
    policySha256: POLICY_SHA256,
    actionSha256: ACTION_SHA256,
    evidenceSha256: EVIDENCE_SHA256,
  }, null, 2));

  const snapshot = JSON.parse(String(await readFinal('get_snapshot', [])));
  console.log(JSON.stringify({ event: 'snapshot-before', snapshot }));

  let policyExists = false;
  try { await readFinal('get_policy', [POLICY_ID]); policyExists = true; } catch { /* expected on a fresh deployment */ }
  if (!policyExists) await writeFinal('register-policy', requester, 'register_policy', [POLICY_ID, POLICY_JSON, POLICY_SHA256]);

  let workflow;
  try { workflow = JSON.parse(String(await readFinal('get_workflow', [WORKFLOW_ID]))); } catch { workflow = null; }
  if (!workflow) {
    await writeFinal('create-workflow', requester, 'create_workflow', [WORKFLOW_ID, POLICY_ID, ACTION_URI, ACTION_SHA256, beneficiary.address], ESCROW);
    workflow = JSON.parse(String(await readFinal('get_workflow', [WORKFLOW_ID])));
  }
  if (workflow.beneficiary?.toLowerCase() !== beneficiary.address.toLowerCase()) throw new Error('Existing workflow beneficiary does not match the supplied beneficiary wallet.');
  if (workflow.status === 'FUNDED') {
    await writeFinal('submit-evidence', beneficiary, 'submit_evidence', [WORKFLOW_ID, EVIDENCE_URI, EVIDENCE_SHA256]);
    workflow = JSON.parse(String(await readFinal('get_workflow', [WORKFLOW_ID])));
  }
  if (workflow.status === 'EVIDENCE_SUBMITTED') {
    await writeFinal('review-workflow', reviewer, 'review_workflow', [WORKFLOW_ID]);
    workflow = JSON.parse(String(await readFinal('get_workflow', [WORKFLOW_ID])));
  }
  if (!['APPROVED', 'REJECTED'].includes(workflow.status)) throw new Error(`Workflow did not reach a finalized decision: ${workflow.status}`);
  const recipient = workflow.claim_recipient;
  const recipientAccount = recipient?.toLowerCase() === beneficiary.address.toLowerCase() ? beneficiary : recipient?.toLowerCase() === requester.address.toLowerCase() ? requester : null;
  if (!recipientAccount) throw new Error(`Finalized claim recipient ${recipient || 'unknown'} does not match the supplied wallets.`);
  if (!workflow.claimed) {
    const payoutAllocation = {
      messageType: MessageType.External,
      onAcceptance: false,
      recipient: recipientAccount.address,
      callKey: CALL_KEY_UNNAMED,
      budget: PAYOUT_EXTERNAL_GAS_LIMIT * PAYOUT_EXTERNAL_MAX_GAS_PRICE,
      feeParams: encodeExternalMessageFeeParams({
        gasLimit: PAYOUT_EXTERNAL_GAS_LIMIT,
        maxGasPrice: PAYOUT_EXTERNAL_MAX_GAS_PRICE,
      }),
    };
    await writeFinal('claim-payout', recipientAccount, 'claim_payout', [WORKFLOW_ID], 0n, {
      messageAllocations: [payoutAllocation],
    });
    workflow = JSON.parse(String(await readFinal('get_workflow', [WORKFLOW_ID])));
  }
  const finalSnapshot = JSON.parse(String(await readFinal('get_snapshot', [])));
  console.log(json({ event: 'complete', workflow, snapshot: finalSnapshot }));
} catch (error) {
  fail(error?.message || String(error));
}
