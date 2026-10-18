import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTransaction} from '../lib/tx-outcome.mjs';
import {describeStatus} from '../lib/guards.mjs';
import {CONTRACT_ADDRESS,HISTORIC} from '../lib/constants.mjs';
const hash=HISTORIC[1].hash;
const success={id:hash,recipient:CONTRACT_ADDRESS,status:7,txExecutionResult:1};
const details={status:'FINALIZED'};
test('status parser refuses NOT_FINALIZED as FINALIZED',()=>{
  assert.equal(describeStatus('NOT_FINALIZED'),'UNKNOWN');
  assert.equal(describeStatus('FINALIZED'),'FINALIZED');
});
test('finalization and EVM receipt alone do not prove execution',()=>{
  const x=classifyTransaction(hash,details,null,{transactionHash:hash,status:'0x1'});
  assert.equal(x.finalized,true); assert.equal(x.executionSucceeded,false);
  assert.equal(x.outcome,'FINALIZED_EXECUTION_UNVERIFIED');
});
test('successful exact receipt verifies execution, not policy label',()=>{
  const x=classifyTransaction(hash,details,success,null);
  assert.equal(x.outcome,'SUCCESS'); assert.equal(x.executionSucceeded,true);
  assert.equal(x.receiptIdentityVerified,true);
});
test('failed execution refuses false success even if EVM receipt successful',()=>{
  const x=classifyTransaction(hash,details,{...success,txExecutionResult:2},{transactionHash:hash,status:'0x1'});
  assert.equal(x.outcome,'EXECUTION_FAILED'); assert.equal(x.executionSucceeded,false);
});
test('wrong transaction or recipient cannot prove execution',()=>{
  for(const broken of [{...success,id:HISTORIC[0].hash},{...success,recipient:'0x0000000000000000000000000000000000000001'}]) {
    const x=classifyTransaction(hash,details,broken,null);
    assert.equal(x.executionSucceeded,false);assert.equal(x.outcome,'FINALIZED_EXECUTION_UNVERIFIED');
  }
});
test('receipt not itself finalized cannot prove success',()=>{
  assert.equal(classifyTransaction(hash,details,{...success,status:5},null).executionSucceeded,false);
});
test('success receipt but consensus still accepted is not finalized',()=>{
  const x=classifyTransaction(hash,{status:'ACCEPTED'},success,null);
  assert.equal(x.executionSucceeded,false);assert.equal(x.finalized,false);
});
test('missing execution field is unknown, even after finality',()=>{
  assert.equal(classifyTransaction(hash,details,{id:hash,recipient:CONTRACT_ADDRESS,status:7},null).outcome,'FINALIZED_EXECUTION_UNVERIFIED');
});
test('named execution result can be checked when number absent',()=>{
  const x=classifyTransaction(hash,details,{id:hash,recipient:CONTRACT_ADDRESS,status:7,txExecutionResultName:'FINISHED_WITH_RETURN'},null);
  assert.equal(x.executionSucceeded,true);
});
