import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, normalizeHash, receiptState, sameAddress, sameChainId } from '../src/transactions.js';
test('binds UI to exact contract version', () => assert.equal(CONTRACT_VERSION, 'ADVISORY_FUSE_V2'));
test('normalizes only a real transaction hash', () => {
  const hash = `0x${'ab'.repeat(32)}`; assert.equal(normalizeHash({ txId: hash }), hash);
  assert.throws(() => normalizeHash('pending'));
});
test('finalized requires successful execution and consensus agreement', () => {
  const ok = receiptState({ statusName:'FINALIZED', result_name:'MAJORITY_AGREE', consensus_data:{leader_receipt:{mode:'leader',execution_result:'SUCCESS'}} });
  assert.equal(ok.finalized, true);
  const bad = receiptState({ statusName:'FINALIZED', result_name:'MAJORITY_DISAGREE', consensus_data:{leader_receipt:{execution_result:'SUCCESS'}} });
  assert.equal(bad.failed, true);
});
test('wallet and chain comparisons normalize representation', () => {
  assert.equal(sameAddress('0xAbC','0xabc'), true); assert.equal(sameChainId('0x1','1'), true);
});
