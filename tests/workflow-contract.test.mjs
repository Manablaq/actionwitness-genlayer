import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('contracts/action_witness_workflow.py'), 'utf8');
const page = await readFile(resolve('app/page.jsx'), 'utf8');
const sharedPage = await readFile(resolve('app/shared-workflow-page.jsx'), 'utf8');
const healthRoute = await readFile(resolve('app/api/health/route.js'), 'utf8');
const snapshotRoute = await readFile(resolve('app/api/snapshot/route.js'), 'utf8');
const workflowRoute = await readFile(resolve('app/api/workflow/[id]/route.js'), 'utf8');
const policyRoute = await readFile(resolve('app/api/policy/[id]/route.js'), 'utf8');
const finalizedReader = await readFile(resolve('lib/finalized-workflow-read.mjs'), 'utf8');
const deployScript = await readFile(resolve('scripts/deploy-workflow.mjs'), 'utf8');

test('shared workflow has no deployer-only write boundary', () => {
  assert.match(source, /class ActionWitnessWorkflow\(gl\.contract\.Contract\)/);
  assert.doesNotMatch(source, /OWNER_ONLY|self\.owner\s*=|owner:\s*Address/);
  assert.match(source, /def register_policy\(/);
  assert.match(source, /def create_workflow\(/);
  assert.match(source, /def submit_evidence\(/);
  assert.match(source, /def review_workflow\(/);
});

test('workflow binds two parties and native GEN escrow', () => {
  assert.match(source, /@gl\.public\.write\.payable/);
  assert.match(source, /gl\.message\.value/);
  assert.match(source, /beneficiary = _as_address\(beneficiary\)/);
  assert.match(source, /requester = _sender\(\)/);
  assert.match(source, /def _sender\(\)/);
  assert.match(source, /requester == beneficiary/);
  assert.match(source, /Only the beneficiary may submit evidence/);
  assert.match(source, /Only the finalized claim recipient may claim/);
  assert.match(source, /emit_transfer\(value=u256\(amount\)\)/);
  assert.doesNotMatch(source, /emit_transfer\([^\n]*\bon=/);
});

test('review independently retrieves both pinned artifacts and validates policy output', () => {
  assert.match(source, /gl\.nondet\.web\.request\(uri, method="GET"\)/);
  assert.match(source, /observed != expected_sha256/);
  assert.match(source, /gl\.vm\.run_nondet\(evaluate_once, validator_fn\)/);
  assert.match(source, /fresh = self\._review\(workflow_mem, policy_json\)/);
  assert.match(source, /proposed\.get\("criteria_results"\) == fresh\.get\("criteria_results"\)/);
  assert.match(source, /Model decision contradicts committed policy criteria/);
});

test('payout is replay protected and decision-bound', () => {
  assert.match(source, /workflow\.status not in \(STATUS_APPROVED, STATUS_REJECTED\)/);
  assert.match(source, /if workflow\.claimed:/);
  assert.match(source, /workflow\.claimed = True/);
  assert.match(source, /workflow\.claim_recipient = workflow\.beneficiary if result\["decision"\] == DECISION_APPROVED else workflow\.requester/);
});

test('policy hashing is canonical and rejects uncommitted fields', () => {
  assert.match(source, /ensure_ascii=False/);
  assert.match(source, /if set\(raw\) != \{"name", "criteria"\}/);
  assert.match(source, /name = name\.strip\(\)/);
});

test('active frontend exposes only the shared workflow path', () => {
  assert.doesNotMatch(page, /review_sample|OWNER_ONLY|action_witness_gate0/);
  assert.doesNotMatch(sharedPage, /review_sample|OWNER_ONLY|action_witness_gate0/);
  assert.doesNotMatch(sharedPage, /className="app-shell"/);
  assert.match(sharedPage, /className="workflow-shell"/);
  assert.match(sharedPage, /create_workflow/);
  assert.match(sharedPage, /accountsChanged/);
  assert.match(sharedPage, /chainChanged/);
  assert.doesNotMatch(sharedPage, /readContract/);
  assert.match(sharedPage, /fetch\(`\/api\/workflow\//);
  assert.match(sharedPage, /fetch\(`\/api\/policy\//);
  assert.match(sharedPage, /credential-free HTTPS origin/);
  assert.match(sharedPage, /placeholder="Enter a finalized workflow ID"/);
});

test('deployment preflight is pinned to Studio Devnet and fails closed', () => {
  assert.match(deployScript, /studioDevnet/);
  assert.match(deployScript, /EXPECTED_CHAIN_ID = 61997/);
  assert.match(deployScript, /getContractSchemaForCode/);
  assert.match(deployScript, /ACTIONWITNESS_DEPLOY_CONFIRM/);
  assert.match(deployScript, /ACTIONWITNESS_DEPLOYER_PRIVATE_KEY/);
  assert.doesNotMatch(deployScript, /testnetBradbury|studionet|action_witness_gate0/);
});

test('live runner can target a corrected immutable deployment explicitly', async () => {
  const runner = await readFile(resolve('scripts/run-live-evidence.mjs'), 'utf8');
  assert.match(runner, /ACTIONWITNESS_LIVE_CONTRACT_ADDRESS/);
  assert.match(runner, /process\.env\.ACTIONWITNESS_LIVE_CONTRACT_ADDRESS/);
  assert.match(runner, /0xB291b9de5D5982824CbFE6C084Ac543823254DF1/);
  assert.doesNotMatch(runner, /0x0B5B0Dc6Af8556F0686e2dd3FF2106ab642C8023/);
  assert.match(runner, /MessageType\.External/);
  assert.match(runner, /CALL_KEY_UNNAMED/);
  assert.match(runner, /encodeExternalMessageFeeParams/);
  assert.match(runner, /messageAllocations: quote\.messageAllocations/);
  assert.match(runner, /messageAllocations: \[payoutAllocation\]/);
});

test('health endpoint verifies the configured deployment schema from finalized state', () => {
  assert.match(healthRoute, /get_snapshot/);
  assert.match(healthRoute, /TransactionHashVariant\.LATEST_FINAL/);
  assert.match(healthRoute, /snapshot\?\.schema === WORKFLOW_SCHEMA/);
  assert.match(healthRoute, /contractSchemaVerified/);
});

test('snapshot endpoint refuses an unexpected deployment schema', () => {
  assert.match(snapshotRoute, /TransactionHashVariant\.LATEST_FINAL/);
  assert.match(snapshotRoute, /snapshot\?\.schema !== WORKFLOW_SCHEMA/);
  assert.match(snapshotRoute, /schemaVerified:true/);
});

test('public workflow and policy reads are server-side and pinned to latest finalized state', () => {
  assert.match(finalizedReader, /TransactionHashVariant\.LATEST_FINAL/);
  assert.match(finalizedReader, /functionName: 'get_snapshot'/);
  assert.match(finalizedReader, /snapshot\?\.schema !== WORKFLOW_SCHEMA/);
  assert.match(finalizedReader, /function validWorkflowId/);
  assert.match(workflowRoute, /validWorkflowId\(id\)/);
  assert.match(workflowRoute, /readVerifiedFinal\('get_workflow', \[id\]\)/);
  assert.match(workflowRoute, /workflow\?\.workflow_id !== id/);
  assert.match(workflowRoute, /source: 'LATEST_FINAL', schemaVerified: true/);
  assert.match(policyRoute, /readVerifiedFinal\('get_policy', \[id\]\)/);
  assert.match(policyRoute, /source: 'LATEST_FINAL', schemaVerified: true/);
});

