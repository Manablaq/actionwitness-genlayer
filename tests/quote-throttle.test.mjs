import test from 'node:test';import assert from 'node:assert/strict';
import {newQuoteThrottle} from '../lib/quote-throttle.mjs';
test('in-process fee-simulation quota stops repeated requests',()=>{
  const p=newQuoteThrottle({windowMs:1000,max:2});
  assert.equal(p(1000),true);assert.equal(p(1001),true);assert.equal(p(1002),false);
  assert.equal(p(2000),true);assert.equal(p(2001),true);assert.equal(p(2002),false);
});
