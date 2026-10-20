import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { isGate0Owner, requireGate0Owner } from '../lib/owner-gate.mjs';
import { VERIFIED_OWNER, MAX_REVIEW_LENGTH } from '../lib/constants.mjs';
import { validateAction } from '../lib/guards.mjs';

test('historical owner-only guard remains isolated from the shared workflow', () => {
  assert.equal(isGate0Owner(VERIFIED_OWNER), true);
  assert.equal(isGate0Owner(VERIFIED_OWNER.toLowerCase()), true);
  assert.equal(requireGate0Owner(VERIFIED_OWNER), true);
  for (const bad of [undefined, null, '', '0x'+'0'.repeat(40), '0x'+'1'.repeat(40), '0x1234']) {
    assert.equal(isGate0Owner(bad), false);
    assert.throws(() => requireGate0Owner(bad), /OWNER_ONLY/);
  }
});
test('the default route cannot fall back to the historical owner-only UI', () => {
  const ui=readFileSync(new URL('../app/page.jsx',import.meta.url),'utf8');
  const shared=readFileSync(new URL('../app/shared-workflow-page.jsx',import.meta.url),'utf8');
  assert.match(ui,/SharedWorkflowPage/);
  assert.doesNotMatch(ui,/review_sample|requireGate0Owner|OWNER_ONLY/);
  assert.match(shared,/WORKFLOW_CONTRACT_ADDRESS/);
  assert.match(shared,/create_workflow/);
  assert.match(shared,/submit_evidence/);
});
test('review size respects exact owner-only contract 400-character bound', () => {
  assert.equal(MAX_REVIEW_LENGTH,400);
  assert.equal(validateAction('a'.repeat(400)),null);
  assert.match(validateAction('a'.repeat(401)),/400/);
});
