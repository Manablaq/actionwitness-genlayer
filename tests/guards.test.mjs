import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAction, isHash, isAddress, parseGenCap, formatGen, normalizeSnapshot, describeStatus } from '../lib/guards.mjs';
import { CONTRACT_ADDRESS, CHAIN_ID, HISTORIC } from '../lib/constants.mjs';

test('verified network and historical fixture boundaries are pinned', () => {
  assert.equal(CHAIN_ID,61997);
  assert.equal(CONTRACT_ADDRESS,'0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4');
  assert.equal(HISTORIC.length,2);
  assert.equal(HISTORIC[0].decision,'DENY');
  assert.equal(HISTORIC[1].decision,'ALLOW');
  HISTORIC.forEach(x=>assert.ok(isHash(x.hash)));
});
test('input validation accepts synthetic policy actions',()=>{
  assert.equal(validateAction('Synthetic test: redacted report.'),null);
  assert.ok(validateAction('short'));
  assert.ok(validateAction('x'.repeat(501)));
  assert.ok(validateAction('control\u0000char'));
});
test('only full 32-byte transaction hashes and addresses accepted',()=>{
  assert.ok(isHash(HISTORIC[0].hash));
  assert.ok(!isHash('0x1234'));
  assert.ok(!isHash('0x'+'g'.repeat(64)));
  assert.ok(isAddress(CONTRACT_ADDRESS));
  assert.ok(!isAddress('0x1234'));
});
test('explicit fee cap conversions do not round up',()=>{
  assert.equal(parseGenCap('0.0005'),500000000000000n);
  assert.equal(parseGenCap('0.000000000000000001'),1n);
  assert.equal(parseGenCap('1'),1000000000000000000n);
  assert.equal(formatGen(380473200010352n,12),'0.000380473200');
  for (const bad of ['-1','NaN','Infinity','1e3','0','0.','0.0000000000000000001','1,000', ' 0.1']) {
    assert.throws(()=>parseGenCap(bad));
  }
});
const GOOD={schema:'ACTIONWITNESS_GATE0_V1',last_label:'actionwitness-gate0-live-probe-01',probe_count:1,review_count:2,last_decision:'ALLOW',last_evidence_sha256:HISTORIC[1].inputHash,authorization_usable:false};
test('snapshot validation requires the actual Gate 0 schema',()=>{
  assert.deepEqual(normalizeSnapshot(GOOD),GOOD);
  assert.deepEqual(normalizeSnapshot(JSON.stringify(GOOD)),GOOD);
  assert.throws(()=>normalizeSnapshot({...GOOD,authorization_usable:true}),/safety boundary/);
  assert.throws(()=>normalizeSnapshot({...GOOD,review_count:'2'}),/Invalid counters/);
  assert.throws(()=>normalizeSnapshot({...GOOD,last_decision:'AUTHORIZED'}),/Unexpected Gate 0/);
  assert.throws(()=>normalizeSnapshot({...GOOD,schema:'NOT_ACTIONWITNESS'}),/Unexpected Gate 0/);
});
test('consensus status normalization never upgrades ACCEPTED to FINALIZED',()=>{
  assert.equal(describeStatus('FINALIZED'),'FINALIZED');
  assert.equal(describeStatus('Accepted'),'ACCEPTED');
  assert.equal(describeStatus('pending'),'PENDING');
  assert.equal(describeStatus('Unknown'),'UNKNOWN');
});
